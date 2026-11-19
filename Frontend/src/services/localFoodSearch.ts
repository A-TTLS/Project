/**
 * localFoodSearch.ts
 * ------------------
 * Manages loading, caching, and querying of:
 * 1. Malaysian campus foods (/datasets/malaysian_foods.json) with food images (/images/foods/)
 * 2. USDA FoodData Central (/datasets/optimized_foods.json or fallback .csv)
 *
 * Provides a unified, blazing-fast search engine prioritizing Malaysian dishes.
 */

export interface LocalFood {
  id: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size: string;
  image_url?: string | null;
  category?: string;
  ingredients?: string[];
  source?: 'malaysian' | 'usda' | string;
}

let _malaysianCache: LocalFood[] | null = null;
let _usdaCache: LocalFood[] | null = null;
let _unifiedCache: LocalFood[] | null = null;

let _loadPromise: Promise<LocalFood[]> | null = null;

/** Helper to parse CSV formatted text in browser without external dependencies */
function parseSimpleCSV(text: string): LocalFood[] {
  const lines = text.split(/\r?\n/);
  if (lines.length <= 1) return [];

  const results: LocalFood[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields: string[] = [];
    let cur = '';
    let inQuote = false;

    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        if (inQuote && line[j + 1] === '"') {
          cur += '"';
          j++;
        } else {
          inQuote = !inQuote;
        }
      } else if (ch === ',' && !inQuote) {
        fields.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    fields.push(cur);

    if (fields.length >= 6) {
      results.push({
        id: fields[0],
        name: fields[1],
        calories: parseInt(fields[2], 10) || 0,
        protein_g: parseFloat(fields[3]) || 0,
        carbs_g: parseFloat(fields[4]) || 0,
        fat_g: parseFloat(fields[5]) || 0,
        serving_size: fields[6] || '100g',
        source: 'usda',
      });
    }
  }
  return results;
}

/** Fetch and cache the Malaysian food catalog */
export async function loadMalaysianFoods(): Promise<LocalFood[]> {
  if (_malaysianCache) return _malaysianCache;

  console.log('[localFoodSearch] Attempting to fetch Malaysian foods dataset from /datasets/malaysian_foods.json ...');
  try {
    const res = await fetch('/datasets/malaysian_foods.json');
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: any[] = await res.json();
    _malaysianCache = data.map((d, idx) => ({
      id: d.id || `malay_${idx}`,
      name: d.name,
      calories: Math.round(d.calories || 0),
      protein_g: Math.round((d.protein_g || 0) * 10) / 10,
      carbs_g: Math.round((d.carbs_g || 0) * 10) / 10,
      fat_g: Math.round((d.fat_g || 0) * 10) / 10,
      serving_size: d.serving_size || '1 serving',
      image_url: d.image_url || null,
      category: d.category || 'Malaysian Dish',
      ingredients: d.ingredients || [],
      source: 'malaysian',
    }));
    console.log(`[localFoodSearch] ✅ Loaded ${_malaysianCache.length} Malaysian foods into memory.`);
    return _malaysianCache;
  } catch (err: any) {
    console.warn('[localFoodSearch] Failed to load malaysian_foods.json:', err.message);
    return [];
  }
}

/** Fetch and cache the USDA dataset (JSON with CSV fallback) */
export async function loadUSDAFoods(): Promise<LocalFood[]> {
  if (_usdaCache) return _usdaCache;

  console.log('[localFoodSearch] Attempting to fetch USDA dataset from /datasets/optimized_foods.json (or .csv) ...');
  // Try JSON first
  try {
    const res = await fetch('/datasets/optimized_foods.json');
    if (res.ok) {
      const data: any[] = await res.json();
      _usdaCache = data.map((d) => ({
        ...d,
        source: 'usda',
      }));
      console.log(`[localFoodSearch] ✅ Loaded ${_usdaCache.length} USDA foods from JSON.`);
      return _usdaCache;
    }
  } catch (err: any) {
    console.warn('[localFoodSearch] USDA JSON fetch failed, trying CSV fallback...', err.message);
  }

  // Fallback to CSV
  try {
    const res = await fetch('/datasets/optimized_foods.csv');
    if (!res.ok) throw new Error(`CSV fetch returned status ${res.status}`);
    const text = await res.text();
    _usdaCache = parseSimpleCSV(text);
    console.log(`[localFoodSearch] ✅ Loaded ${_usdaCache.length} USDA foods from CSV.`);
    return _usdaCache;
  } catch (csvErr: any) {
    console.error('[localFoodSearch] ❌ Failed to load USDA dataset:', csvErr.message);
    return [];
  }
}

/**
 * Unified loader: loads both Malaysian and USDA foods and returns the combined catalog.
 */
export async function loadLocalFoods(): Promise<LocalFood[]> {
  if (_unifiedCache && _unifiedCache.length > 0) return _unifiedCache;
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    console.log('[localFoodSearch] Initiating load of all local food datasets (Malaysian + USDA)...');
    const [malaysian, usda] = await Promise.all([
      loadMalaysianFoods(),
      loadUSDAFoods(),
    ]);

    if (malaysian.length === 0 && usda.length === 0) {
      throw new Error('Could not load datasets: neither malaysian_foods.json nor optimized_foods found.');
    }

    // Place Malaysian foods at the front so search hits priority Malaysian dishes first
    _unifiedCache = [...malaysian, ...usda];
    console.log(`[localFoodSearch] 🎉 Unified catalog ready with ${_unifiedCache.length} total foods (${malaysian.length} Malaysian, ${usda.length} USDA)`);
    return _unifiedCache;
  })();

  return _loadPromise;
}

/**
 * Filter the in-memory food catalog by query string and optional nutrition filters.
 * Returns Malaysian foods first, followed by USDA foods.
 */
export function searchLocalFoods(
  foods: LocalFood[],
  q: string,
  limit = 20,
  filters?: { maxCalories?: number; highProtein?: boolean }
): LocalFood[] {
  const searchTerm = (q || '').trim();
  if (!searchTerm) {
    console.log('[localFoodSearch] searchLocalFoods query is empty. Returning 0 results.');
    return [];
  }

  const lower = searchTerm.toLowerCase();
  const malaysianMatches: LocalFood[] = [];
  const usdaMatches: LocalFood[] = [];

  for (const food of foods) {
    const nameMatch = food.name && food.name.toLowerCase().includes(lower);
    const catMatch = food.category && food.category.toLowerCase().includes(lower);

    if (nameMatch || catMatch) {
      // Apply filters if specified
      if (filters?.maxCalories && food.calories > filters.maxCalories) continue;
      if (filters?.highProtein && food.protein_g < 20) continue;

      if (food.source === 'malaysian') {
        malaysianMatches.push(food);
      } else {
        usdaMatches.push(food);
      }
    }
  }

  // Combine results with Malaysian foods prioritized
  const combined = [...malaysianMatches, ...usdaMatches].slice(0, limit);

  console.log(
    `[localFoodSearch] Query (q): "${searchTerm}" | Matched: ${combined.length} (${malaysianMatches.length} Malaysian, ${usdaMatches.length} USDA)`,
    combined
  );

  return combined;
}

/** Reset in-memory cache */
export function clearLocalFoodCache(): void {
  _malaysianCache = null;
  _usdaCache = null;
  _unifiedCache = null;
  _loadPromise = null;
}
