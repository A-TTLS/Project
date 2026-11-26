/**
 * CalorieSnap - Weight Tracking & Analytics Service
 * Connects to Supabase 'weight_logs' and 'profiles' tables
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface WeightLog {
  id: string;
  user_id: string;
  weight_kg: number;
  note?: string | null;
  recorded_at: string;
}

export const weightService = {
  /**
   * Fetch weight logs for a user over a specific timeframe
   */
  async fetchWeightLogs(
    userId: string,
    timeframe: '7D' | '30D' | 'All' = '7D'
  ): Promise<WeightLog[]> {
    if (!isSupabaseConfigured || !userId) {
      // Fallback local mock data from localStorage if available
      try {
        const cached = localStorage.getItem(`caloriesnap_weight_logs_${userId}`);
        if (cached) return JSON.parse(cached);
      } catch {}
      return [];
    }

    try {
      let query = supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: true });

      if (timeframe === '7D') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        query = query.gte('recorded_at', d.toISOString());
      } else if (timeframe === '30D') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        query = query.gte('recorded_at', d.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        try {
          localStorage.setItem(`caloriesnap_weight_logs_${userId}`, JSON.stringify(data));
        } catch {}
      }

      return data || [];
    } catch (err: any) {
      console.warn('Error fetching weight logs:', err.message);
      try {
        const cached = localStorage.getItem(`caloriesnap_weight_logs_${userId}`);
        if (cached) return JSON.parse(cached);
      } catch {}
      return [];
    }
  },

  /**
   * Log a new weight entry, updating both 'weight_logs' and 'profiles.current_weight_kg'
   */
  async logWeight(
    userId: string,
    weightKg: number,
    note?: string
  ): Promise<{ success: boolean; data?: WeightLog; error?: string }> {
    if (!userId) return { success: false, error: 'User not authenticated' };

    const roundedWeight = Math.round(weightKg * 10) / 10;
    const nowIso = new Date().toISOString();

    if (!isSupabaseConfigured) {
      const mockLog: WeightLog = {
        id: `local_w_${Date.now()}`,
        user_id: userId,
        weight_kg: roundedWeight,
        note: note || null,
        recorded_at: nowIso,
      };
      return { success: true, data: mockLog };
    }

    try {
      // 1. Insert into weight_logs
      const { data, error: insertError } = await supabase
        .from('weight_logs')
        .insert({
          user_id: userId,
          weight_kg: roundedWeight,
          note: note || null,
          recorded_at: nowIso,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Sync to profiles.current_weight_kg
      await supabase
        .from('profiles')
        .update({
          current_weight_kg: roundedWeight,
          updated_at: nowIso,
        })
        .eq('id', userId);

      return { success: true, data };
    } catch (err: any) {
      console.error('Error logging weight to Supabase:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Delete a weight entry
   */
  async deleteWeightLog(id: string, userId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !userId) return true;

    try {
      const { error } = await supabase
        .from('weight_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error deleting weight log:', err);
      return false;
    }
  },
};
