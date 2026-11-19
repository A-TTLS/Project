/**
 * localFoodSearch.ts
 * ------------------
 * Fetches /datasets/optimized_foods.json (or fallback /datasets/optimized_foods.csv)
 * on demand, parses and caches it in memory, and provides rapid client-side search.
 */

export interface LocalFood {
  id: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size: string; // e.g. '100g'
}

let _cache: LocalFood[] | null = null;
let _loadPromise: Promise<LocalFood[]> | null = null;

/** Helper to parse CSV formatted text in browser without external dependencies */
function parseSimpleCSV(text: string): LocalFood[] {
  const lines = text.split(/\r?\n/);
  if (lines.length <= 1) return [];

  const results: LocalFood[] = [];
  // Expected headers: id,name,calories,protein_g,carbs_g,fat_g,serving_size
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
      });
    }
  }
  return results;
}

/**
 * Load and cache the full food dataset.
 * Checks for /datasets/optimized_foods.json first, then falls back to /datasets/optimized_foods.csv.
 */
export async function loadLocalFoods(): Promise<LocalFood[]> {
  if (_cache && _cache.length > 0) return _cache;
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    console.log('[localFoodSearch] Fetching dataset from /datasets/optimized_foods.json (or .csv)...');

    // 1. Try JSON format first (fastest)
    try {
      const res = await fetch('/datasets/optimized_foods.json');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          _cache = data;
          console.log(`[localFoodSearch] ✅ Successfully loaded ${_cache.length} foods from optimized_foods.json`);
          return _cache;
        }
      }
      console.warn(`[localFoodSearch] JSON fetch returned status ${res.status}, attempting CSV fallback...`);
    } catch (jsonErr) {
      console.warn('[localFoodSearch] JSON fetch failed, attempting CSV fallback:', jsonErr);
    }

    // 2. Try CSV fallback
    try {
      console.log('[localFoodSearch] Attempting to fetch from /datasets/optimized_foods.csv ...');
      const csvRes = await fetch('/datasets/optimized_foods.csv');
      if (!csvRes.ok) {
        throw new Error(`Failed to load dataset: neither optimized_foods.json nor optimized_foods.csv found (status: ${csvRes.status})`);
      }
      const csvText = await csvRes.text();
      const parsed = parseSimpleCSV(csvText);
      if (parsed.length === 0) {
        throw new Error('optimized_foods.csv was empty or failed to parse');
      }
      _cache = parsed;
      console.log(`[localFoodSearch] ✅ Successfully loaded ${_cache.length} foods from optimized_foods.csv`);
      return _cache;
    } catch (csvErr: any) {
      console.error('[localFoodSearch] ❌ Failed to fetch or parse dataset:', csvErr);
      throw csvErr;
    }
  })();

  return _loadPromise;
}

/**
 * Filter the in-memory food list by a search query.
 * Returns up to `limit` results (default 15).
 */
export function searchLocalFoods(
  foods: LocalFood[],
  q: string,
  limit = 15
): LocalFood[] {
  const searchTerm = (q || '').trim();
  if (!searchTerm) {
    console.log('[localFoodSearch] searchLocalFoods query is empty. Returning 0 results.');
    return [];
  }

  const lower = searchTerm.toLowerCase();
  const results: LocalFood[] = [];

  for (const food of foods) {
    if (food.name && food.name.toLowerCase().includes(lower)) {
      results.push(food);
      if (results.length >= limit) break;
    }
  }

  console.log(`[localFoodSearch] Query (q): "${searchTerm}" | Filtered results count: ${results.length}`, results);
  return results;
}

/** Clear the in-memory cache */
export function clearLocalFoodCache(): void {
  _cache = null;
  _loadPromise = null;
}
