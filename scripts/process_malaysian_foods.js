/**
 * process_malaysian_foods.js
 * ----------------------------
 * Standalone Node.js script to:
 * 1. Parse C:\HS\UTM Y3S1\AD\myFood11-master\README.md to map numbered folders (1-11) to food names.
 * 2. Extract 1 representative image from each folder, rename to <slug>.jpg, and copy to Frontend/public/images/foods/.
 * 3. Parse C:\HS\UTM Y3S1\AD\malay-dishes-dataset-main to extract Malay dishes, ingredients, and categories.
 * 4. Merge datasets: match myFood11 images to Malay recipes (case-insensitive), keep unmatched items from both.
 * 5. Export unified JSON to Frontend/public/datasets/malaysian_foods.json.
 */

const fs = require('fs');
const path = require('path');

// ── Directory Paths ────────────────────────────────────────────────────────
const MYFOOD11_DIR = 'C:\\HS\\UTM Y3S1\\AD\\myFood11-master';
const MALAY_DISHES_DIR = 'C:\\HS\\UTM Y3S1\\AD\\malay-dishes-dataset-main';
const FRONTEND_DIR = path.join(__dirname, '..', 'Frontend');
const IMAGES_DEST_DIR = path.join(FRONTEND_DIR, 'public', 'images', 'foods');
const DATASET_DEST_FILE = path.join(FRONTEND_DIR, 'public', 'datasets', 'malaysian_foods.json');

// ── Slug Helper ────────────────────────────────────────────────────────────
function toSlug(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Standard Malaysian Nutrition Estimation ─────────────────────────────────
function estimateNutrition(name) {
  const n = (name || '').toLowerCase();

  if (n.includes('nasi lemak')) return { calories: 650, protein_g: 22, carbs_g: 80, fat_g: 28, serving_size: '1 plate (350g)' };
  if (n.includes('nasi goreng')) return { calories: 550, protein_g: 18, carbs_g: 75, fat_g: 20, serving_size: '1 plate (330g)' };
  if (n.includes('nasi') || n.includes('rice')) return { calories: 210, protein_g: 4.5, carbs_g: 45, fat_g: 0.8, serving_size: '1 bowl (150g)' };
  if (n.includes('ayam goreng') || n.includes('fried chicken')) return { calories: 290, protein_g: 26, carbs_g: 8, fat_g: 17, serving_size: '1 piece (130g)' };
  if (n.includes('ayam') || n.includes('chicken')) return { calories: 240, protein_g: 25, carbs_g: 6, fat_g: 13, serving_size: '1 portion (150g)' };
  if (n.includes('rendang')) return { calories: 460, protein_g: 32, carbs_g: 10, fat_g: 32, serving_size: '1 portion (180g)' };
  if (n.includes('laksa')) return { calories: 480, protein_g: 20, carbs_g: 62, fat_g: 17, serving_size: '1 bowl (400g)' };
  if (n.includes('mee goreng') || n.includes('fried noodle')) return { calories: 520, protein_g: 16, carbs_g: 72, fat_g: 19, serving_size: '1 plate (320g)' };
  if (n.includes('mee') || n.includes('bihun') || n.includes('kuey teow') || n.includes('noodle')) return { calories: 380, protein_g: 14, carbs_g: 58, fat_g: 11, serving_size: '1 bowl (350g)' };
  if (n.includes('curry puff') || n.includes('karipap')) return { calories: 135, protein_g: 3, carbs_g: 16, fat_g: 7, serving_size: '1 piece (45g)' };
  if (n.includes('boiled egg') || n.includes('telur rebus')) return { calories: 78, protein_g: 6.3, carbs_g: 0.6, fat_g: 5.3, serving_size: '1 egg (50g)' };
  if (n.includes('telur') || n.includes('egg')) return { calories: 110, protein_g: 7, carbs_g: 1, fat_g: 9, serving_size: '1 serving' };
  if (n.includes('burger')) return { calories: 450, protein_g: 22, carbs_g: 40, fat_g: 24, serving_size: '1 burger (200g)' };
  if (n.includes('pizza')) return { calories: 280, protein_g: 12, carbs_g: 32, fat_g: 11, serving_size: '1 slice (105g)' };
  if (n.includes('steak')) return { calories: 420, protein_g: 45, carbs_g: 0, fat_g: 26, serving_size: '1 steak (220g)' };
  if (n.includes('fries') || n.includes('kentang goreng')) return { calories: 320, protein_g: 3.5, carbs_g: 42, fat_g: 16, serving_size: '1 regular (117g)' };
  if (n.includes('roti canai')) return { calories: 310, protein_g: 6, carbs_g: 42, fat_g: 13, serving_size: '1 piece (95g)' };
  if (n.includes('ikan') || n.includes('fish') || n.includes('seafood')) return { calories: 220, protein_g: 28, carbs_g: 4, fat_g: 10, serving_size: '1 serving' };
  if (n.includes('sup') || n.includes('soup')) return { calories: 160, protein_g: 15, carbs_g: 9, fat_g: 7, serving_size: '1 bowl (300ml)' };
  if (n.includes('sambal')) return { calories: 150, protein_g: 4, carbs_g: 14, fat_g: 9, serving_size: '2 tbsp (40g)' };
  if (n.includes('kuih') || n.includes('dessert')) return { calories: 160, protein_g: 2.5, carbs_g: 28, fat_g: 4.5, serving_size: '1 piece (60g)' };

  // Generic balanced Malaysian dish fallback
  return { calories: 360, protein_g: 16, carbs_g: 42, fat_g: 14, serving_size: '1 serving' };
}

// ── STEP 1: Parse myFood11 README and copy first image ──────────────────────
function processMyFood11() {
  console.log('\n[1/4] Parsing myFood11 README.md ...');
  const readmePath = path.join(MYFOOD11_DIR, 'README.md');

  if (!fs.existsSync(readmePath)) {
    console.error(`❌ myFood11 README not found at: ${readmePath}`);
    return [];
  }

  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  // Match lines like "1- Rice", "4-Steak", "10- Curry Puff"
  const lineRegex = /^\s*(\d+)\s*[-:]\s*([^\r\n]+)/gm;
  const categories = [];
  let match;

  while ((match = lineRegex.exec(readmeContent)) !== null) {
    const folderNum = match[1].trim();
    const foodName = match[2].trim();
    categories.push({ folderNum, foodName });
  }

  console.log(`    Found ${categories.length} food categories in README.md`);

  // Ensure output directory exists
  fs.mkdirSync(IMAGES_DEST_DIR, { recursive: true });

  const myFoodItems = [];

  for (const cat of categories) {
    // Check folder path (e.g. "1" or "01")
    let folderPath = path.join(MYFOOD11_DIR, cat.folderNum);
    if (!fs.existsSync(folderPath)) {
      const padded = cat.folderNum.padStart(2, '0');
      folderPath = path.join(MYFOOD11_DIR, padded);
    }

    if (!fs.existsSync(folderPath)) {
      console.warn(`    ⚠️ Folder not found for category "${cat.foodName}": ${folderPath}`);
      continue;
    }

    // Find the first image in the folder
    const files = fs.readdirSync(folderPath);
    const imageFile = files.find((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));

    let imagePath = null;
    const slug = toSlug(cat.foodName);

    if (imageFile) {
      const srcFile = path.join(folderPath, imageFile);
      const destFilename = `${slug}.jpg`;
      const destFile = path.join(IMAGES_DEST_DIR, destFilename);

      try {
        fs.copyFileSync(srcFile, destFile);
        imagePath = `/images/foods/${destFilename}`;
        console.log(`    📸 [${cat.folderNum}] ${cat.foodName} -> copied "${imageFile}" to "${imagePath}"`);
      } catch (copyErr) {
        console.error(`    ❌ Failed to copy image for ${cat.foodName}:`, copyErr.message);
      }
    } else {
      console.warn(`    ⚠️ No image found in folder ${cat.folderNum} for "${cat.foodName}"`);
    }

    const nutrition = estimateNutrition(cat.foodName);

    myFoodItems.push({
      id: `myfood11_${cat.folderNum}`,
      name: cat.foodName,
      category: 'Malaysian / Campus Food',
      slug,
      image_url: imagePath,
      calories: nutrition.calories,
      protein_g: nutrition.protein_g,
      carbs_g: nutrition.carbs_g,
      fat_g: nutrition.fat_g,
      serving_size: nutrition.serving_size,
      source: 'myFood11',
    });
  }

  console.log(`    ✅ Successfully processed ${myFoodItems.length} items from myFood11`);
  return myFoodItems;
}

// ── STEP 2: Parse malay-dishes-dataset-main ────────────────────────────────
function parseMalayDishesYaml(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const dishes = [];

  let curDish = null;
  let inIngredients = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check for start of a new link/dish: "- title:" or "title:"
    const titleMatch = trimmed.match(/^-\s*title:\s*(.*)$/) || trimmed.match(/^title:\s*(.*)$/);
    if (titleMatch) {
      if (curDish && curDish.title) {
        dishes.push(curDish);
      }
      inIngredients = false;
      let rawTitle = titleMatch[1].trim().replace(/^["']|["']$/g, '');
      curDish = {
        title: rawTitle,
        url: '',
        ingredients: [],
        cooking_method: '',
        dish_type: '',
        ingredient_types: [],
      };
      continue;
    }

    if (!curDish) continue;

    // url
    const urlMatch = trimmed.match(/^url:\s*(.*)$/);
    if (urlMatch) {
      curDish.url = urlMatch[1].trim().replace(/^["']|["']$/g, '');
      continue;
    }

    // cooking_method
    const cmMatch = trimmed.match(/^cooking_method:\s*(.*)$/);
    if (cmMatch) {
      curDish.cooking_method = cmMatch[1].trim().replace(/^["']|["']$/g, '');
      continue;
    }

    // dish_type
    const dtMatch = trimmed.match(/^dish_type:\s*(.*)$/);
    if (dtMatch) {
      curDish.dish_type = dtMatch[1].trim().replace(/^["']|["']$/g, '');
      continue;
    }

    // ingredient_types
    const itMatch = trimmed.match(/^ingredient_types:\s*\[(.*)\]$/);
    if (itMatch) {
      curDish.ingredient_types = itMatch[1]
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
      continue;
    }

    // ingredients start
    if (trimmed.startsWith('ingredients:')) {
      if (trimmed.includes('[') && trimmed.includes(']')) {
        // Single line array
        const inner = trimmed.substring(trimmed.indexOf('[') + 1, trimmed.lastIndexOf(']'));
        curDish.ingredients = inner
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
        inIngredients = false;
      } else if (trimmed.includes('[')) {
        inIngredients = true;
      }
      continue;
    }

    // ingredients multiline
    if (inIngredients) {
      if (trimmed.includes(']')) {
        inIngredients = false;
        const before = trimmed.substring(0, trimmed.indexOf(']')).trim();
        if (before) {
          const item = before.replace(/,$/, '').trim().replace(/^["']|["']$/g, '');
          if (item) curDish.ingredients.push(item);
        }
      } else {
        const item = trimmed.replace(/,$/, '').trim().replace(/^["']|["']$/g, '');
        if (item) curDish.ingredients.push(item);
      }
    }
  }

  if (curDish && curDish.title) {
    dishes.push(curDish);
  }

  return dishes;
}

function processMalayDishes() {
  console.log('\n[2/4] Parsing malay-dishes-dataset-main ...');
  const scrapeDir = path.join(MALAY_DISHES_DIR, 'scrape');

  if (!fs.existsSync(scrapeDir)) {
    console.warn(`    ⚠️ Scrape directory not found: ${scrapeDir}`);
    return [];
  }

  const files = fs.readdirSync(scrapeDir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
  console.log(`    Found ${files.length} recipe YAML files in scrape/`);

  const allDishes = [];
  const seenTitles = new Set();

  for (const file of files) {
    const fullPath = path.join(scrapeDir, file);
    try {
      const dishes = parseMalayDishesYaml(fullPath);
      let addedFromFile = 0;

      for (const d of dishes) {
        // Clean title: remove "Resepi ", "Resipi ", "X Resepi ", numbers
        let cleanName = d.title
          .replace(/^\d+\s*(?:resepi|resipi)\s*/i, '')
          .replace(/^(?:resepi|resipi)\s*/i, '')
          .replace(/\s*\([^)]*\)$/, '') // remove (sedap), (mudah) etc
          .trim();

        if (!cleanName || cleanName.length < 3) cleanName = d.title;

        const key = cleanName.toLowerCase();
        if (seenTitles.has(key)) continue;
        seenTitles.add(key);

        const nutrition = estimateNutrition(cleanName);

        allDishes.push({
          id: `malay_${allDishes.length + 1}`,
          name: cleanName,
          original_title: d.title,
          category: d.dish_type || 'Malay Cuisine',
          cooking_method: d.cooking_method || undefined,
          ingredients: d.ingredients || [],
          ingredient_types: d.ingredient_types || ['halal'],
          calories: nutrition.calories,
          protein_g: nutrition.protein_g,
          carbs_g: nutrition.carbs_g,
          fat_g: nutrition.fat_g,
          serving_size: nutrition.serving_size,
          url: d.url || undefined,
          source: 'malay-dishes-dataset',
        });
        addedFromFile++;
      }

      console.log(`    📄 ${file}: parsed ${dishes.length} items (${addedFromFile} unique added)`);
    } catch (err) {
      console.error(`    ❌ Error parsing ${file}:`, err.message);
    }
  }

  console.log(`    ✅ Total unique Malay dishes collected: ${allDishes.length}`);
  return allDishes;
}

// ── STEP 3: Merge datasets ─────────────────────────────────────────────────
function mergeDatasets(myFoodItems, malayDishes) {
  console.log('\n[3/4] Merging datasets ...');
  const merged = [];
  const matchedMyFoodIndices = new Set();

  for (const dish of malayDishes) {
    const dishNameLower = dish.name.toLowerCase();

    // Check if any myFood item matches this recipe
    let matchedFood = null;
    for (let i = 0; i < myFoodItems.length; i++) {
      const mf = myFoodItems[i];
      const mfNameLower = mf.name.toLowerCase();

      // Case-insensitive matching: full match, or substring match
      if (dishNameLower === mfNameLower || dishNameLower.includes(mfNameLower) || mfNameLower.includes(dishNameLower)) {
        matchedFood = mf;
        matchedMyFoodIndices.add(i);
        break;
      }
    }

    if (matchedFood) {
      // Merge with image and photo metadata from myFood11
      merged.push({
        ...dish,
        image_url: matchedFood.image_url,
        matched_category: matchedFood.name,
      });
      console.log(`    🔗 Merged recipe "${dish.name}" with myFood11 category "${matchedFood.name}" (image: ${matchedFood.image_url})`);
    } else {
      // Recipe without matched myFood11 image
      merged.push({
        ...dish,
        image_url: null,
      });
    }
  }

  // Include myFood11 items that didn't match any Malay recipe (e.g. Steak, Burger, Pizza, Fries)
  let unmatchedCount = 0;
  for (let i = 0; i < myFoodItems.length; i++) {
    if (!matchedMyFoodIndices.has(i)) {
      const mf = myFoodItems[i];
      merged.push({
        id: mf.id,
        name: mf.name,
        category: mf.category,
        image_url: mf.image_url,
        calories: mf.calories,
        protein_g: mf.protein_g,
        carbs_g: mf.carbs_g,
        fat_g: mf.fat_g,
        serving_size: mf.serving_size,
        ingredients: [],
        source: 'myFood11',
      });
      unmatchedCount++;
      console.log(`    ➕ Added unmatched myFood11 item "${mf.name}" (image: ${mf.image_url})`);
    }
  }

  console.log(`    ✅ Total items in merged catalog: ${merged.length}`);
  console.log(`       - Recipes matched with myFood11: ${matchedMyFoodIndices.size}`);
  console.log(`       - Additional standalone myFood11 items: ${unmatchedCount}`);
  return merged;
}

// ── STEP 4: Export to JSON ─────────────────────────────────────────────────
function exportToJson(data) {
  console.log('\n[4/4] Exporting to Frontend/public/datasets/malaysian_foods.json ...');
  fs.mkdirSync(path.dirname(DATASET_DEST_FILE), { recursive: true });

  fs.writeFileSync(DATASET_DEST_FILE, JSON.stringify(data, null, 2), 'utf8');

  const sizeKB = (fs.statSync(DATASET_DEST_FILE).size / 1024).toFixed(1);
  console.log(`\n🎉 DONE! Generated dataset successfully:`);
  console.log(`   File: ${DATASET_DEST_FILE}`);
  console.log(`   Total items: ${data.length}`);
  console.log(`   File size: ${sizeKB} KB`);
}

// ── Main Execution ─────────────────────────────────────────────────────────
(function main() {
  console.log('====================================================');
  console.log('🇲🇾 Malaysian Food Dataset Processor (myFood11 + Malay Dishes)');
  console.log('====================================================');
  const t0 = Date.now();

  try {
    const myFoodItems = processMyFood11();
    const malayDishes = processMalayDishes();
    const mergedData = mergeDatasets(myFoodItems, malayDishes);
    exportToJson(mergedData);
    console.log(`\n⏱ Execution completed in ${((Date.now() - t0) / 1000).toFixed(2)}s`);
  } catch (err) {
    console.error('❌ Fatal error processing datasets:', err);
    process.exit(1);
  }
})();

