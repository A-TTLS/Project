import { supabase } from './supabaseClient';

// Member 5 · Rewards: SnapPoints, daily missions and vouchers.
// Reads come straight from the tables (RLS limits them to the signed-in user).
// Anything that changes points goes through an SQL function in
// database/member5_rewards.sql, never through a direct insert or update.

export type MissionType = 'snap_3_meals' | 'steps_8000' | 'water_2000';

export interface Mission {
  id: string;
  mission_type: MissionType;
  current_progress: number;
  target_progress: number;
  points_reward: number;
  is_completed: boolean;
  is_claimed: boolean;
}

export interface Voucher {
  id: string;
  brand: string;
  title: string;
  discount_label: string;
  points_cost: number;
  terms: string | null;
  color_hex: string;
  stock: number | null;
}

export interface WalletVoucher {
  id: string;
  voucher_code: string;
  status: 'active' | 'redeemed' | 'expired';
  claimed_at: string;
  expires_at: string;
  brand: string;
  title: string;
}

export interface PointsSummary {
  snapPoints: number;
  streakDays: number;
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Returns null when nobody is signed in, so screens can fall back to demo data. */
export async function getPointsSummary(): Promise<PointsSummary | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('snap_points, streak_days')
    .eq('id', userId)
    .single();
  if (error) throw error;

  return { snapPoints: data.snap_points ?? 0, streakDays: data.streak_days ?? 0 };
}

/** Creates today's missions if needed and returns them with fresh progress. */
export async function getTodayMissions(): Promise<Mission[]> {
  const { data, error } = await supabase.rpc('refresh_my_missions');
  if (error) throw error;
  return (data ?? []) as Mission[];
}

/** Collects a completed mission's points. Returns the new balance. */
export async function claimMission(missionId: string): Promise<number> {
  const { data, error } = await supabase.rpc('claim_mission', { p_mission_id: missionId });
  if (error) throw error;
  return data as number;
}

export async function getVouchers(): Promise<Voucher[]> {
  const { data, error } = await supabase
    .from('vouchers')
    .select('id, brand, title, discount_label, points_cost, terms, color_hex, stock')
    .eq('is_active', true)
    .order('points_cost', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Voucher[];
}

export async function getMyWallet(): Promise<WalletVoucher[]> {
  const { data, error } = await supabase
    .from('claimed_vouchers')
    .select('id, voucher_code, status, claimed_at, expires_at, vouchers(brand, title)')
    .order('claimed_at', { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const voucher = Array.isArray(row.vouchers) ? row.vouchers[0] : row.vouchers;
    return {
      id: row.id,
      voucher_code: row.voucher_code,
      status: row.status,
      claimed_at: row.claimed_at,
      expires_at: row.expires_at,
      brand: voucher?.brand ?? '',
      title: voucher?.title ?? '',
    };
  });
}

/** Spends points on a voucher. The server checks balance and stock. */
export async function redeemVoucher(voucherId: string): Promise<{ code: string; expiresAt: string }> {
  const { data, error } = await supabase.rpc('redeem_voucher', { p_voucher_id: voucherId });
  if (error) throw error;
  return { code: data.voucher_code, expiresAt: data.expires_at };
}
