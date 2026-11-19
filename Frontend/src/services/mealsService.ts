/**
 * CalorieSnap - Supabase Meals & Daily Metrics Database Service
 * Group: A TTLS (UTM Group 1)
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { calculateStreakFromDates } from './nutritionService';
import { uploadMealImage } from './mealImageUpload';

export interface DbMeal {
  id?: string;
  user_id?: string;
  name: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  portion_multiplier?: number;
  image_url?: string;
  is_public?: boolean;
  logged_at?: string;
}

export interface MockAIAnalysisResult {
  meal_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  confidence: number;
}

export interface FoodCatalogItem {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size: string;
  location_hint: string;
  tags: string[];
}

export interface DetectedFoodTag {
  label: string;
  calories: number;
  confidence: number;
}

const fallbackFoodCatalog: FoodCatalogItem[] = [
  {
    id: 'f1',
    name: 'Hainanese Steamed Chicken Rice',
    category: 'Lunch',
    calories: 560,
    protein_g: 34,
    carbs_g: 62,
    fat_g: 16,
    serving_size: '1 plate',
    location_hint: 'rice chicken',
    tags: ['rice', 'chicken', 'protein', 'steamed'],
  },
  {
    id: 'f2',
    name: 'Nasi Lemak Ayam Berempah',
    category: 'Lunch',
    calories: 650,
    protein_g: 28,
    carbs_g: 72,
    fat_g: 26,
    serving_size: '1 serving',
    location_hint: 'malay rice set',
    tags: ['rice', 'coconut', 'chicken', 'sambal'],
  },
  {
    id: 'f3',
    name: 'Roti Canai with Dhal & Sambal',
    category: 'Breakfast',
    calories: 380,
    protein_g: 9,
    carbs_g: 52,
    fat_g: 15,
    serving_size: '1 serving',
    location_hint: 'breakfast',
    tags: ['bread', 'dhal', 'sambal', 'flatbread'],
  },
  {
    id: 'f4',
    name: 'Subway 6-inch Roasted Chicken Breast',
    category: 'Dinner',
    calories: 320,
    protein_g: 26,
    carbs_g: 42,
    fat_g: 5,
    serving_size: '1 sandwich',
    location_hint: 'subway chicken',
    tags: ['chicken', 'bread', 'salad', 'protein'],
  },
  {
    id: 'f5',
    name: 'Greek Yogurt with Mixed Berries & Chia',
    category: 'Breakfast',
    calories: 220,
    protein_g: 18,
    carbs_g: 26,
    fat_g: 4,
    serving_size: '1 bowl',
    location_hint: 'berries yogurt',
    tags: ['yogurt', 'berries', 'chia', 'healthy'],
  },
  {
    id: 'f6',
    name: 'Chicken Salad Bowl',
    category: 'Lunch',
    calories: 430,
    protein_g: 32,
    carbs_g: 28,
    fat_g: 18,
    serving_size: '1 bowl',
    location_hint: 'salad greens',
    tags: ['chicken', 'salad', 'greens', 'veggie'],
  },
];

function normalizeFoodText(value: string): string {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreCatalogMatch(query: string, item: FoodCatalogItem): number {
  const normalizedQuery = normalizeFoodText(query);
  if (!normalizedQuery) return 0;

  const candidateText = normalizeFoodText(`${item.name} ${item.category} ${item.location_hint} ${item.tags.join(' ')}`);
  const queryTerms = normalizedQuery.split(' ').filter(Boolean);
  let score = 0;

  for (const term of queryTerms) {
    if (!term) continue;
    if (candidateText.includes(term)) {
      score += 3;
    }
    if (item.name.toLowerCase().includes(term)) {
      score += 2;
    }
    if (item.tags.some((tag) => normalizeFoodText(tag).includes(term))) {
      score += 2;
    }
  }

  if (candidateText.includes(normalizedQuery)) {
    score += 4;
  }

  return score;
}

async function getFoodCatalogCandidates(query = ''): Promise<FoodCatalogItem[]> {
  const normalizedQuery = normalizeFoodText(query);

  if (isSupabaseConfigured) {
    try {
      let results: any[] = [];
      if (normalizedQuery) {
        const { data, error } = await supabase
          .from('food_catalog')
          .select('*')
          .ilike('name', `%${normalizedQuery}%`)
          .limit(10);

        if (!error && data?.length) results = data;
      }

      if (!results.length) {
        const { data, error } = await supabase.from('food_catalog').select('*').limit(20);
        if (!error && data?.length) results = data;
      }

      if (results.length) return results as FoodCatalogItem[];
    } catch (err) {
      console.warn('Food catalog lookup failed, falling back to local catalog:', err);
    }
  }

  const candidates = normalizedQuery
    ? fallbackFoodCatalog.filter((item) => scoreCatalogMatch(normalizedQuery, item) > 0)
    : fallbackFoodCatalog;

  return candidates.length ? candidates : fallbackFoodCatalog;
}

export async function matchFoodCatalogByDescription(
  description?: string,
  fallbackName?: string
): Promise<FoodCatalogItem | null> {
  const combinedQuery = [description, fallbackName].filter(Boolean).join(' ');
  const candidates = await getFoodCatalogCandidates(combinedQuery);

  if (!combinedQuery.trim()) return candidates[0] ?? null;

  const ranked = [...candidates].sort(
    (a, b) => scoreCatalogMatch(combinedQuery, b) - scoreCatalogMatch(combinedQuery, a)
  );

  return ranked[0] ?? candidates[0] ?? null;
}

/**
 * 1. Mock AI Analysis Helper
 * Simulates a realistic nutritional breakdown with network latency.
 *
 * The demo app uses a food catalog and keyword matching so the scanned result
 * resolves to a real database item even before a user enters a manual description.
 */
export async function mockAnalyzeFoodPhoto(
  fileOrUrl?: File | Blob | string,
  description?: string
): Promise<MockAIAnalysisResult & { tags: DetectedFoodTag[] }> {
  // Simulate 1-second network latency
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const fileName = typeof fileOrUrl === 'string' ? fileOrUrl : fileOrUrl instanceof File ? fileOrUrl.name : '';
  const searchText = [description, fileName].filter(Boolean).join(' ');
  const matchedFood = await matchFoodCatalogByDescription(searchText, 'meal');

  if (matchedFood) {
    const mealName = matchedFood.name;
    const calories = matchedFood.calories;
    const protein = matchedFood.protein_g;
    const carbs = matchedFood.carbs_g;
    const fat = matchedFood.fat_g;

    return {
      meal_name: mealName,
      calories,
      protein,
      carbs,
      fat,
      meal_type: matchedFood.category as 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks',
      confidence: 0.94,
      tags: [
        { label: mealName, calories, confidence: 0.94 },
        { label: `Protein • ${protein}g`, calories: protein * 4, confidence: 0.9 },
        { label: `Carbs • ${carbs}g`, calories: carbs * 4, confidence: 0.88 },
      ],
    };
  }

  const mockDatabase: MockAIAnalysisResult[] = [
    {
      meal_name: 'Nasi Lemak Ayam Berempah',
      calories: 650,
      protein: 28,
      carbs: 72,
      fat: 26,
      meal_type: 'Lunch',
      confidence: 0.94,
    },
    {
      meal_name: 'Hainanese Steamed Chicken Rice',
      calories: 560,
      protein: 34,
      carbs: 62,
      fat: 16,
      meal_type: 'Lunch',
      confidence: 0.96,
    },
    {
      meal_name: 'Roti Canai with Dhal & Sambal',
      calories: 380,
      protein: 9,
      carbs: 52,
      fat: 15,
      meal_type: 'Breakfast',
      confidence: 0.92,
    },
    {
      meal_name: 'Subway 6-inch Roasted Chicken Breast',
      calories: 320,
      protein: 26,
      carbs: 42,
      fat: 5,
      meal_type: 'Dinner',
      confidence: 0.98,
    },
    {
      meal_name: 'Greek Yogurt with Mixed Berries & Chia',
      calories: 220,
      protein: 18,
      carbs: 26,
      fat: 4,
      meal_type: 'Breakfast',
      confidence: 0.95,
    },
  ];

  const randomIndex = Math.floor(Math.random() * mockDatabase.length);
  const fallbackMeal = mockDatabase[randomIndex];
  return {
    ...fallbackMeal,
    tags: [
      { label: fallbackMeal.meal_name, calories: fallbackMeal.calories, confidence: fallbackMeal.confidence },
      { label: `Protein • ${fallbackMeal.protein}g`, calories: fallbackMeal.protein * 4, confidence: fallbackMeal.confidence },
      { label: `Carbs • ${fallbackMeal.carbs}g`, calories: fallbackMeal.carbs * 4, confidence: fallbackMeal.confidence },
    ],
  };
}

export const mealsService = {
  /**
   * 2. Log Meal with Social Share
   * Handles optional photo storage upload, inserts into meals table (is_public: true),
   * and auto-creates a linked public social_posts record for the Discover feed.
   */
  async logMealWithSocialShare(
    meal: Omit<DbMeal, 'id' | 'user_id'>,
    photoFile?: File | Blob,
    currentUserId?: string
  ): Promise<{ success: boolean; meal?: any; post?: any; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = currentUserId || user?.id;

      if (!targetUserId) {
        return { success: false, error: 'User is not authenticated' };
      }

      // Step A: Upload photo if a File/Blob is provided
      let finalImageUrl = meal.image_url || null;
      if (photoFile) {
        try {
          const uploadRes = await uploadMealImage(photoFile, targetUserId);
          finalImageUrl = uploadRes.publicUrl;
        } catch (uploadErr: any) {
          console.warn('Photo upload fallback warning:', uploadErr.message);
        }
      }

      // Step B: Insert into public.meals (setting is_public: true)
      const mealPayload = {
        user_id: targetUserId,
        name: meal.name,
        category: meal.category,
        calories: Math.round(meal.calories),
        protein_g: Number(meal.protein_g) || 0,
        carbs_g: Number(meal.carbs_g) || 0,
        fat_g: Number(meal.fat_g) || 0,
        portion_multiplier: meal.portion_multiplier || 1.0,
        image_url: finalImageUrl,
        is_public: true, // Always true so RLS policies permit shared viewing
        logged_at: meal.logged_at || new Date().toISOString(),
      };

      const { data: createdMeal, error: mealError } = await supabase
        .from('meals')
        .insert(mealPayload)
        .select()
        .single();

      if (mealError) throw mealError;

      // Step C: Automatically insert linked post into public.social_posts
      const caption = `Just logged ${meal.name} for ${meal.category.toLowerCase()} 🍽️ ${Math.round(meal.calories)} kcal · ${meal.protein_g}g protein`;
      const postPayload = {
        user_id: targetUserId,
        meal_id: createdMeal?.id || null,
        caption,
        location_name: 'UTM Campus',
        image_url: finalImageUrl || `https://source.unsplash.com/400x300/?${encodeURIComponent(meal.name + ' food')}`,
        calories: Math.round(meal.calories),
        pct_daily_goal: Math.min(100, Math.round((meal.calories / 1850) * 100)),
        visibility: 'public', // Appears immediately on shared Discover feed
        created_at: new Date().toISOString(),
      };

      const { data: createdPost, error: postError } = await supabase
        .from('social_posts')
        .insert(postPayload)
        .select()
        .single();

      if (postError) {
        console.warn('Social post insert notice:', postError.message);
      }

      return {
        success: true,
        meal: createdMeal,
        post: createdPost,
      };
    } catch (err: any) {
      console.error('Error in logMealWithSocialShare:', err);
      return { success: false, error: err.message || 'Failed to log meal and share' };
    }
  },

  /**
   * 3. Food & Meals Search Function
   * Searches both logged meals and the Malaysian campus food catalog
   * with case-insensitive pattern matching (.ilike) and optional nutrition filters.
   */
  async searchMealsAndFoods(
    q = '',
    filters?: { maxCalories?: number; highProtein?: boolean }
  ): Promise<any[]> {
    console.log('[mealsService.searchMealsAndFoods] Searching with query (q):', `"${q}"`, 'Filters:', filters);

    if (!isSupabaseConfigured) {
      console.warn('[mealsService.searchMealsAndFoods] Supabase not configured. Returning empty array.');
      return [];
    }

    try {
      const searchTerm = q.trim();
      let query = supabase
        .from('food_catalog')
        .select('*');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (filters?.maxCalories) {
        query = query.lte('calories', filters.maxCalories);
      }

      if (filters?.highProtein) {
        query = query.gte('protein_g', 20);
      }

      const { data: catalogResults, error: catalogError } = await query
        .order('calories', { ascending: true })
        .limit(20);

      if (catalogError) throw catalogError;
      const results = catalogResults || [];
      console.log(`[mealsService.searchMealsAndFoods] Found ${results.length} results for query (q): "${searchTerm}"`, results);
      return results;
    } catch (err: any) {
      console.error('Error searching meals and foods:', err);
      return [];
    }
  },
  /**
   * 1. Log a new meal to public.meals and sync with daily_metrics
   */
  async logMeal(meal: DbMeal, currentUserId?: string): Promise<{ success: boolean; meal?: any; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: true, meal: { ...meal, id: 'local_' + Date.now() } };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = currentUserId || user?.id;

      if (!targetUserId) {
        return { success: false, error: 'User not signed in' };
      }

      const mealPayload = {
        user_id: targetUserId,
        name: meal.name,
        category: meal.category,
        calories: Math.round(meal.calories),
        protein_g: meal.protein_g,
        carbs_g: meal.carbs_g,
        fat_g: meal.fat_g,
        portion_multiplier: meal.portion_multiplier || 1.0,
        image_url: meal.image_url || null,
        is_public: meal.is_public ?? true, // Default to true so RLS allows public viewing
        logged_at: meal.logged_at || new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('meals')
        .insert(mealPayload)
        .select()
        .single();

      if (error) throw error;

      return { success: true, meal: data };
    } catch (err: any) {
      console.error('Error logging meal to Supabase:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * 2. Fetch meals logged today for the authenticated user
   */
  async fetchTodayMeals(currentUserId?: string): Promise<DbMeal[]> {
    if (!isSupabaseConfigured) return [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = currentUserId || user?.id;
      if (!targetUserId) return [];

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('logged_at', todayStart.toISOString())
        .order('logged_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching today meals:', err);
      return [];
    }
  },

  /**
   * 3. Fetch user streak (using RPC function or date analysis)
   */
  async fetchUserStreak(currentUserId?: string): Promise<{ current: number; longest: number }> {
    if (!isSupabaseConfigured) return { current: 1, longest: 1 };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = currentUserId || user?.id;
      if (!targetUserId) return { current: 0, longest: 0 };

      // Try running the calculate_user_streak RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('calculate_user_streak', {
        p_user_id: targetUserId,
      });

      if (!rpcError && rpcData && rpcData.length > 0) {
        return {
          current: rpcData[0].current_streak || 0,
          longest: rpcData[0].longest_streak || 0,
        };
      }

      // Fallback: Query meal dates manually and calculate
      const { data: meals } = await supabase
        .from('meals')
        .select('logged_at')
        .eq('user_id', targetUserId)
        .order('logged_at', { ascending: false });

      if (meals && meals.length > 0) {
        return calculateStreakFromDates(meals.map(m => m.logged_at));
      }

      return { current: 0, longest: 0 };
    } catch (err) {
      console.warn('Could not fetch streak from RPC:', err);
      return { current: 1, longest: 1 };
    }
  },

  /**
   * 4. Query Malaysian Food Catalog
   */
  async searchFoodCatalog(searchTerm = '', category?: string): Promise<FoodCatalogItem[]> {
    if (!isSupabaseConfigured) return [];

    try {
      let query = supabase.from('food_catalog').select('*');

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }
      if (searchTerm.trim()) {
        query = query.ilike('name', `%${searchTerm.trim()}%`);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error querying food catalog:', err);
      return [];
    }
  },

  /**
   * 5. Sync water intake to public.daily_metrics
   */
  async updateDailyWater(waterMl: number, currentUserId?: string): Promise<boolean> {
    if (!isSupabaseConfigured) return true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = currentUserId || user?.id;
      if (!targetUserId) return false;

      const todayStr = new Date().toISOString().slice(0, 10);

      const { error } = await supabase
        .from('daily_metrics')
        .upsert(
          {
            user_id: targetUserId,
            metric_date: todayStr,
            water_ml: waterMl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,metric_date' }
        );

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating daily water in Supabase:', err);
      return false;
    }
  },
};

