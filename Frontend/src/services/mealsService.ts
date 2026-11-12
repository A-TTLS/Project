/**
 * CalorieSnap - Supabase Meals & Daily Metrics Database Service
 * Group: A TTLS (UTM Group 1)
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { calculateStreakFromDates } from './nutritionService';

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

export const mealsService = {
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
        is_public: meal.is_public ?? false,
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

