"""Download the small Malaysian cuisine Hugging Face dataset into food_photos/."""
from pathlib import Path
import re

from datasets import load_dataset

DATASET_ID = 'ychwodhrey/malaysian-cuisine'
OUTPUT_DIR = Path('food_photos')

dataset = load_dataset(DATASET_ID, split='train')
saved = 0
for index, row in enumerate(dataset):
    label = str(row.get('label') or '').strip().lower()
    safe_label = re.sub(r'[^a-z0-9_-]+', '_', label).strip('_')
    image = row.get('image')
    if not safe_label or image is None:
        print(f'Skipping row {index}: missing image or label')
        continue
    folder = OUTPUT_DIR / safe_label
    folder.mkdir(parents=True, exist_ok=True)
    image.convert('RGB').save(folder / f'{index:04d}.jpg', quality=95)
    saved += 1

print(f'Saved {saved} images across {len(list(OUTPUT_DIR.iterdir()))} label folders in {OUTPUT_DIR.resolve()}')
print('Review the folders and add many more varied photos before training.')
