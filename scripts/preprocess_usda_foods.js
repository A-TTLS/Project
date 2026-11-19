/**
 * USDA FoodData Central Preprocessor
 * ------------------------------------
 * Reads food.csv, food_nutrient.csv, nutrient.csv from the USDA CSV dump,
 * filters to foundation_food + sr_legacy_food data types,
 * extracts Calories / Protein / Carbs / Fat (all per 100g),
 * and writes an optimized JSON file for browser use.
 *
 * Run: node scripts/preprocess_usda_foods.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ── Paths ──────────────────────────────────────────────────────────────────
const USDA_DIR  = 'C:\\HS\\UTM Y3S1\\AD\\FoodData_Central_csv_2026-10-29';
const OUT_PATH  = path.join(__dirname, '..', 'Frontend', 'public', 'datasets', 'optimized_foods.json');
const OUT_CSV_PATH = path.join(__dirname, '..', 'Frontend', 'public', 'datasets', 'optimized_foods.csv');

const FOOD_CSV          = path.join(USDA_DIR, 'food.csv');
const FOOD_NUTRIENT_CSV = path.join(USDA_DIR, 'food_nutrient.csv');
const NUTRIENT_CSV      = path.join(USDA_DIR, 'nutrient.csv');

// ── Nutrient IDs we care about ─────────────────────────────────────────────
const NID_CALORIES = '1008';  // Energy (kcal)
const NID_PROTEIN  = '1003';  // Protein (g)
const NID_CARBS    = '1005';  // Carbohydrate, by difference (g)
const NID_FAT      = '1004';  // Total lipid/fat (g)

const TARGET_NUTRIENT_IDS = new Set([NID_CALORIES, NID_PROTEIN, NID_CARBS, NID_FAT]);
const ALLOWED_DATA_TYPES  = new Set(['foundation_food', 'sr_legacy_food', 'survey_fndds_food']);

// ── Helpers ────────────────────────────────────────────────────────────────
/**
 * Very simple CSV row parser – handles double-quoted fields (including
 * commas inside quotes). No dependency on external packages.
 */
function parseCSVLine(line) {
  const fields = [];
  let cur = '';
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; } // escaped quote
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      fields.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

/** Stream a CSV file line-by-line, calling onRow(fields, lineIndex) for each data row. */
function streamCSV(filePath, onRow) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });

    let headers = null;
    let lineIndex = 0;

    rl.on('line', (line) => {
      if (!line.trim()) return;
      const fields = parseCSVLine(line);
      if (!headers) { headers = fields; return; }
      onRow(fields, headers, lineIndex++);
    });

    rl.on('close', resolve);
    rl.on('error', reject);
  });
}

// ── Step 1: Load filtered food map (fdc_id → description) ─────────────────
async function loadFoods() {
  console.log('[1/3] Reading food.csv …');
  const foodMap = new Map(); // fdc_id → { name }
  let total = 0, kept = 0;

  await streamCSV(FOOD_CSV, (fields, headers) => {
    total++;
    const fdc_id    = fields[headers.indexOf('fdc_id')]?.trim();
    const data_type = fields[headers.indexOf('data_type')]?.trim();
    const desc      = fields[headers.indexOf('description')]?.trim();
    if (!fdc_id || !desc) return;

    if (ALLOWED_DATA_TYPES.has(data_type)) {
      foodMap.set(fdc_id, { name: desc });
      kept++;
    }
  });

  console.log(`    ${total.toLocaleString()} rows read, ${kept.toLocaleString()} kept (foundation + sr_legacy + survey).`);
  return foodMap;
}

// ── Step 2: Stream food_nutrient.csv and accumulate values ─────────────────
async function accumulateNutrients(foodMap) {
  console.log('[2/3] Streaming food_nutrient.csv (this may take a minute) …');
  // nutrientData[fdc_id] = { calories, protein, carbs, fat }
  const nutrientData = new Map();
  let rowCount = 0;
  let matchCount = 0;

  await streamCSV(FOOD_NUTRIENT_CSV, (fields, headers) => {
    rowCount++;
    if (rowCount % 1_000_000 === 0) process.stdout.write(`    … ${(rowCount / 1_000_000).toFixed(0)}M rows processed\r`);

    const fdc_id      = fields[headers.indexOf('fdc_id')]?.trim();
    const nutrient_id = fields[headers.indexOf('nutrient_id')]?.trim();
    const amount      = parseFloat(fields[headers.indexOf('amount')]);

    if (!foodMap.has(fdc_id)) return;
    if (!TARGET_NUTRIENT_IDS.has(nutrient_id)) return;
    if (isNaN(amount)) return;

    matchCount++;
    if (!nutrientData.has(fdc_id)) nutrientData.set(fdc_id, {});
    const entry = nutrientData.get(fdc_id);

    if (nutrient_id === NID_CALORIES) entry.calories  = amount;
    if (nutrient_id === NID_PROTEIN)  entry.protein_g = amount;
    if (nutrient_id === NID_CARBS)    entry.carbs_g   = amount;
    if (nutrient_id === NID_FAT)      entry.fat_g     = amount;
  });

  console.log(`\n    ${rowCount.toLocaleString()} rows scanned, ${matchCount.toLocaleString()} relevant matches.`);
  return nutrientData;
}

// ── Step 3: Merge and write output ─────────────────────────────────────────
function buildOutput(foodMap, nutrientData) {
  console.log('[3/3] Building output …');
  const results = [];

  for (const [fdc_id, food] of foodMap) {
    const n = nutrientData.get(fdc_id);
    if (!n || !n.calories || n.calories <= 0) continue; // must have calories

    results.push({
      id:          fdc_id,
      name:        food.name,
      calories:    Math.round(n.calories),
      protein_g:   Math.round((n.protein_g ?? 0) * 10) / 10,
      carbs_g:     Math.round((n.carbs_g   ?? 0) * 10) / 10,
      fat_g:       Math.round((n.fat_g     ?? 0) * 10) / 10,
      serving_size: '100g',
    });
  }

  // Sort alphabetically by name
  results.sort((a, b) => a.name.localeCompare(b.name));

  // Write JSON
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 0));

  // Write CSV
  const csvHeaders = ['id', 'name', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'serving_size'];
  const csvLines = [csvHeaders.join(',')];
  for (const item of results) {
    const escapedName = `"${(item.name || '').replace(/"/g, '""')}"`;
    csvLines.push([item.id, escapedName, item.calories, item.protein_g, item.carbs_g, item.fat_g, item.serving_size || '100g'].join(','));
  }
  fs.writeFileSync(OUT_CSV_PATH, csvLines.join('\n'), 'utf8');

  const sizeMB = (fs.statSync(OUT_PATH).size / 1024 / 1024).toFixed(2);
  const csvSizeMB = (fs.statSync(OUT_CSV_PATH).size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ Done! ${results.length.toLocaleString()} foods written to:`);
  console.log(`   ${OUT_PATH} (${sizeMB} MB)`);
  console.log(`   ${OUT_CSV_PATH} (${csvSizeMB} MB)`);

  return results.length;
}

// ── Main ───────────────────────────────────────────────────────────────────
(async () => {
  const t0 = Date.now();
  try {
    const foodMap     = await loadFoods();
    const nutrientData = await accumulateNutrients(foodMap);
    buildOutput(foodMap, nutrientData);
    console.log(`⏱  Total time: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();

