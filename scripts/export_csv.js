const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'Frontend', 'public', 'datasets', 'optimized_foods.json');
const csvPath = path.join(__dirname, '..', 'Frontend', 'public', 'datasets', 'optimized_foods.csv');

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const headers = ['id', 'name', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'serving_size'];
const lines = [headers.join(',')];

for (const item of data) {
  const escapedName = `"${(item.name || '').replace(/"/g, '""')}"`;
  lines.push([item.id, escapedName, item.calories, item.protein_g, item.carbs_g, item.fat_g, item.serving_size || '100g'].join(','));
}

fs.writeFileSync(csvPath, lines.join('\n'), 'utf8');
console.log(`Successfully generated optimized_foods.csv with ${lines.length - 1} rows!`);

