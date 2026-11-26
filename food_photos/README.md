# Food photo dataset

Create one folder per dish. The folder name must exactly match a food name in
`Frontend/public/datasets/malaysian_foods.json` so the app can look up nutrition.

Example:

```text
food_photos/
  Nasi Lemak Ayam Berempah/
    photo_001.jpg
  Roti Canai with Dhal & Sambal/
    photo_001.jpg
```

Use the exact catalog spelling as the folder name (spaces are okay). Try to
collect at least 50 varied photos per dish to start; 100+ is better. Include
different plates, lighting, angles, backgrounds, and serving sizes. Remove
near-identical frames from the same video before training so the validation
score reflects how the model handles genuinely new photos.
Images without the target foods are useful too: add a class named `other_food`
and include varied non-target meals. The app will only accept predictions at
75% confidence and only if the predicted label exists in the nutrition catalog.
