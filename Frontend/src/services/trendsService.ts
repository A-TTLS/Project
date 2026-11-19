import { supabase } from './supabaseClient';

// Member 5 · Trend chart and food search.
// Both go through SQL functions in database/member5_trends.sql.

export type TrendRange = 'week' | 'month' | '6months';

export interface CalorieBar {
  bucket_start: string;
  label: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  snacks: number;
  /** Average per logged day in this period (for 'week': the day's total). */
  total: number;
  sum_kcal: number;
  days_logged: number;
  is_current: boolean;
}

export interface CalorieHistory {
  bars: CalorieBar[];
  target: number;
}

export interface FoodItem {
  id: string;
  name: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | 'Beverages';
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size: string;
  location_hint: string | null;
  tags: string[];
}

/** Returns null when nobody is signed in, so the chart can show demo bars. */
export async function getCalorieHistory(range: TrendRange): Promise<CalorieHistory | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const [history, profile] = await Promise.all([
    supabase.rpc('calorie_history', { p_range: range }),
    supabase.from('profiles').select('daily_calorie_target').eq('id', auth.user.id).single(),
  ]);
  if (history.error) throw history.error;

  return {
    bars: (history.data ?? []) as CalorieBar[],
    target: profile.data?.daily_calorie_target || 1850,
  };
}

export async function searchFood(query: string, category = 'All'): Promise<FoodItem[]> {
  const { data, error } = await supabase.rpc('search_food', {
    p_query: query.trim(),
    p_category: category,
    p_limit: 20,
  });
  if (error) throw error;
  return (data ?? []) as FoodItem[];
}
