"""Train a first CalorieSnap food photo classifier using transfer learning.

Expected dataset layout: food_photos/<dish name>/*.(jpg|jpeg|png|webp)
Run from the repository root after installing scripts/requirements-food-model.txt.
"""
from pathlib import Path
import json
import tensorflow as tf

DATA_DIR = Path('food_photos')
OUTPUT_DIR = Path('training_output')
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
SEED = 123

if not DATA_DIR.is_dir():
    raise SystemExit('Create food_photos/<dish name>/ folders and add labeled images first.')

train_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR, validation_split=0.2, subset='training', seed=SEED,
    image_size=IMAGE_SIZE, batch_size=BATCH_SIZE,
)
val_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR, validation_split=0.2, subset='validation', seed=SEED,
    image_size=IMAGE_SIZE, batch_size=BATCH_SIZE,
)
class_names = train_ds.class_names
if len(class_names) < 2:
    raise SystemExit('Add at least two dish folders; classifiers need multiple classes.')

AUTOTUNE = tf.data.AUTOTUNE
augment = tf.keras.Sequential([
    tf.keras.layers.RandomFlip('horizontal'),
    tf.keras.layers.RandomRotation(0.08),
    tf.keras.layers.RandomZoom(0.12),
    tf.keras.layers.RandomContrast(0.12),
])

def prepare(images, labels, training=False):
    images = tf.cast(images, tf.float32)
    if training:
        images = augment(images, training=True)
    return images / 127.5 - 1.0, labels

train_ds = train_ds.map(lambda x, y: prepare(x, y, True), num_parallel_calls=AUTOTUNE).prefetch(AUTOTUNE)
val_ds = val_ds.map(prepare, num_parallel_calls=AUTOTUNE).prefetch(AUTOTUNE)

base = tf.keras.applications.MobileNetV2(
    input_shape=(*IMAGE_SIZE, 3), include_top=False, weights='imagenet'
)
base.trainable = False
inputs = tf.keras.Input(shape=(*IMAGE_SIZE, 3))
x = base(inputs, training=False)
x = tf.keras.layers.GlobalAveragePooling2D()(x)
x = tf.keras.layers.Dropout(0.25)(x)
outputs = tf.keras.layers.Dense(len(class_names), activation='softmax')(x)
model = tf.keras.Model(inputs, outputs)
model.compile(optimizer=tf.keras.optimizers.Adam(1e-3),
              loss='sparse_categorical_crossentropy', metrics=['accuracy'])
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
callbacks = [
    tf.keras.callbacks.EarlyStopping(patience=4, restore_best_weights=True, monitor='val_loss'),
    tf.keras.callbacks.ModelCheckpoint(OUTPUT_DIR / 'best.keras', save_best_only=True, monitor='val_loss'),
]
model.fit(train_ds, validation_data=val_ds, epochs=20, callbacks=callbacks)
model = tf.keras.models.load_model(OUTPUT_DIR / 'best.keras')
model.save(OUTPUT_DIR / 'food_classifier.keras')
(OUTPUT_DIR / 'labels.json').write_text(json.dumps(class_names, indent=2), encoding='utf-8')
print(f'Classes: {class_names}')
print(f'Model and labels saved in {OUTPUT_DIR.resolve()}')
print('Convert with: tensorflowjs_converter --input_format=keras training_output/food_classifier.keras Frontend/public/food-model')
