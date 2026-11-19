import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { getCalorieHistory, type CalorieBar, type TrendRange } from '../services/trendsService';

// Loads the Calorie intake chart for the chosen range.
// isLive is false when nobody is signed in; the chart then shows demo bars.

export interface CalorieHistoryState {
  isLive: boolean;
  loading: boolean;
  error: string | null;
  bars: CalorieBar[];
  target: number;
  /** Average kcal per logged day across the whole range (0 if nothing logged). */
  average: number;
  daysLogged: number;
  reload: () => Promise<void>;
}

export function useCalorieHistory(range: TrendRange): CalorieHistoryState {
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bars, setBars] = useState<CalorieBar[]>([]);
  const [target, setTarget] = useState(1850);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCalorieHistory(range);
      if (!result) {
        setIsLive(false);
        setBars([]);
        return;
      }
      setIsLive(true);
      setBars(result.bars);
      setTarget(result.target);
    } catch (err) {
      setError(err instanceof Error ? err.message : String((err as { message?: string })?.message ?? err));
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void reload();
    });
    return () => data.subscription.unsubscribe();
  }, [reload]);

  const sum = bars.reduce((s, b) => s + b.sum_kcal, 0);
  const daysLogged = bars.reduce((s, b) => s + b.days_logged, 0);
  const average = daysLogged > 0 ? Math.round(sum / daysLogged) : 0;

  return { isLive, loading, error, bars, target, average, daysLogged, reload };
}
