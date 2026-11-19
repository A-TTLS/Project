import { supabase } from './supabaseClient';

// Member 5 · Social: Following & Discover feeds, likes, comments, follows,
// post visibility and sharing a daily progress card.
// Reads go through SQL functions in database/member5_social.sql; the
// database policies decide which posts each user may see.

export type FeedTab = 'following' | 'discover';
export type FeedFilter = 'all' | 'under_500' | 'high_protein' | 'campus';
export type Visibility = 'public' | 'circle' | 'private';

export interface FeedComment {
  author: string;
  content: string;
}

export interface FeedPost {
  post_id: string;
  author_id: string;
  author_name: string;
  author_username: string | null;
  author_avatar: string | null;
  author_streak: number;
  is_me: boolean;
  is_following: boolean;
  is_squadmate: boolean;
  caption: string | null;
  location_name: string | null;
  image_url: string | null;
  calories: number | null;
  protein_g: number | null;
  pct_daily_goal: number | null;
  visibility: Visibility;
  created_at: string;
  like_count: number;
  liked_by_me: boolean;
  comments: FeedComment[];
}

export interface PersonToday {
  user_id: string;
  name: string;
  is_me: boolean;
  pct_today: number;
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Returns null when nobody is signed in, so screens can fall back to demo data. */
export async function getFeed(tab: FeedTab, search = '', filter: FeedFilter = 'all'): Promise<FeedPost[] | null> {
  if (!(await currentUserId())) return null;

  const { data, error } = await supabase.rpc('social_feed', {
    p_tab: tab,
    p_search: search.trim() || null,
    p_filter: filter,
    p_limit: 30,
  });
  if (error) throw error;
  return (data ?? []) as FeedPost[];
}

/** Progress rings: me and my squadmates. */
export async function getPeopleToday(): Promise<PersonToday[]> {
  const { data, error } = await supabase.rpc('my_people_today');
  if (error) throw error;
  return (data ?? []) as PersonToday[];
}

export async function setLike(postId: string, like: boolean): Promise<void> {
  const userId = await currentUserId();
  if (!userId) throw new Error('Not signed in');

  const { error } = like
    ? await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
    : await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
  // 23505 = already liked (double tap); safe to ignore.
  if (error && error.code !== '23505') throw error;
}

export async function addComment(postId: string, content: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId) throw new Error('Not signed in');

  const text = content.trim();
  if (!text) throw new Error('Write something first');
  if (text.length > 500) throw new Error('Comments can be up to 500 characters');

  const { error } = await supabase.from('post_comments').insert({ post_id: postId, user_id: userId, content: text });
  if (error) throw error;
}

export async function setFollow(targetUserId: string, follow: boolean): Promise<void> {
  const userId = await currentUserId();
  if (!userId) throw new Error('Not signed in');

  const { error } = follow
    ? await supabase.from('follows').insert({ follower_id: userId, following_id: targetUserId })
    : await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', targetUserId);
  if (error && error.code !== '23505') throw error;
}

/** SCRUM-27: the author chooses who can see a post. */
export async function setPostVisibility(postId: string, visibility: Visibility): Promise<void> {
  const { error } = await supabase.from('social_posts').update({ visibility }).eq('id', postId);
  if (error) throw error;
}

/** Start of today in Malaysia (UTC+8), as an ISO timestamp. */
function startOfTodayMY(): string {
  const now = new Date();
  const my = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  my.setUTCHours(0, 0, 0, 0);
  return new Date(my.getTime() - 8 * 60 * 60 * 1000).toISOString();
}

/** SCRUM-25: share today's progress card with my circle (or publicly). */
export async function shareDayCard(caption: string, visibility: Visibility): Promise<void> {
  const userId = await currentUserId();
  if (!userId) throw new Error('Not signed in');

  const [{ data: meals, error: mealsError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.from('meals').select('calories').eq('user_id', userId).gte('logged_at', startOfTodayMY()),
    supabase.from('profiles').select('daily_calorie_target').eq('id', userId).single(),
  ]);
  if (mealsError) throw mealsError;
  if (profileError) throw profileError;

  const calories = (meals ?? []).reduce((sum, m: { calories: number | null }) => sum + (m.calories ?? 0), 0);
  const target = profile?.daily_calorie_target || 1850;

  const { error } = await supabase.from('social_posts').insert({
    user_id: userId,
    caption: caption.trim() || `Today's check-in: ${(meals ?? []).length} meals logged 💪`,
    location_name: 'Daily progress',
    calories,
    pct_daily_goal: Math.round((calories / target) * 100),
    visibility,
  });
  if (error) throw error;
}

export interface ProfileStats {
  followers: number;
  following: number;
  circles: number;
  snapPoints: number;
  streakDays: number;
}

/** Profile numbers, read fresh from the database each time the screen opens. */
export async function getProfileStats(): Promise<ProfileStats | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const count = (table: 'follows' | 'group_members', column: string) =>
    supabase.from(table).select('*', { count: 'exact', head: true }).eq(column, userId);

  const [followers, following, circles, profile] = await Promise.all([
    count('follows', 'following_id'),
    count('follows', 'follower_id'),
    count('group_members', 'user_id'),
    supabase.from('profiles').select('snap_points, streak_days').eq('id', userId).single(),
  ]);
  for (const r of [followers, following, circles, profile]) if (r.error) throw r.error;

  return {
    followers: followers.count ?? 0,
    following: following.count ?? 0,
    circles: circles.count ?? 0,
    snapPoints: profile.data?.snap_points ?? 0,
    streakDays: profile.data?.streak_days ?? 0,
  };
}
