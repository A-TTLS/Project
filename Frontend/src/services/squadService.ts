import { supabase } from './supabaseClient';

// Member 5 · Roomie Diet Squad: squads, today's meal board, nudges.
// Every call goes through an SQL function in database/member5_squad.sql,
// which checks that the signed-in user is allowed to see or do it.

export type MealSlot = 'Breakfast' | 'Lunch' | 'Dinner';

export interface Squad {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  my_role: 'admin' | 'member';
  member_count: number;
  total_streak: number;
}

export interface BoardMember {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_me: boolean;
  streak_days: number;
  calories_today: number;
  calorie_target: number;
  has_breakfast: boolean;
  has_lunch: boolean;
  has_dinner: boolean;
  nudged_slots: MealSlot[];
}

/** Returns null when nobody is signed in, so screens can fall back to demo data. */
export async function getMySquads(): Promise<Squad[] | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await supabase.rpc('my_squads');
  if (error) throw error;
  return (data ?? []) as Squad[];
}

export async function createSquad(name: string, description?: string): Promise<Squad> {
  const { data, error } = await supabase.rpc('create_squad', {
    p_name: name,
    p_description: description ?? null,
  });
  if (error) throw error;
  return data as Squad;
}

export async function joinSquad(inviteCode: string): Promise<Squad> {
  const { data, error } = await supabase.rpc('join_squad', { p_invite_code: inviteCode });
  if (error) throw error;
  return data as Squad;
}

export async function getSquadBoard(squadId: string): Promise<BoardMember[]> {
  const { data, error } = await supabase.rpc('squad_board', { p_group_id: squadId });
  if (error) throw error;
  return (data ?? []) as BoardMember[];
}

export async function sendNudge(squadId: string, targetUserId: string, slot: MealSlot): Promise<void> {
  const { error } = await supabase.rpc('send_nudge', {
    p_group_id: squadId,
    p_target_user_id: targetUserId,
    p_meal_slot: slot,
  });
  if (error) throw error;
}

/** Leaving is a plain delete; the database only allows removing your own membership. */
export async function leaveSquad(squadId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', squadId)
    .eq('user_id', auth.user.id);
  if (error) throw error;
}
