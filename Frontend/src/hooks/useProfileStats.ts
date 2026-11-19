import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { getProfileStats, type ProfileStats } from '../services/socialService';

// Followers, Following, Circles, SnapPoints and streak for the Profile screen.
// Loads fresh numbers every time the screen opens, so a follow, a squad join
// or a reward claim made elsewhere shows up straight away.
// Returns null while loading or when nobody is signed in, so the screen can
// keep showing its own placeholder numbers.

export function useProfileStats(): ProfileStats | null {
  const [stats, setStats] = useState<ProfileStats | null>(null);

  const load = useCallback(async () => {
    try {
      setStats(await getProfileStats());
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    void load();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void load();
    });
    return () => data.subscription.unsubscribe();
  }, [load]);

  return stats;
}
