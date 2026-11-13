-- ============================================================================
-- CalorieSnap - Row Level Security (RLS) Policies
-- Group: A TTLS (UTM Group 1)
-- Authors: Aloysius Probo (Backend), Lee Hui Zhen (Frontend)
-- Description: Strict security policies to ensure users only access their own private data.
-- Run Order: Run this script AFTER database/schema.sql.
-- ============================================================================

-- ============================================================================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claimed_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. PROFILES POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Public profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are readable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- ============================================================================
-- 3. MEALS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own or public meals" ON public.meals;
CREATE POLICY "Users can view own or public meals"
  ON public.meals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "Users can insert own meals" ON public.meals;
CREATE POLICY "Users can insert own meals"
  ON public.meals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own meals" ON public.meals;
CREATE POLICY "Users can update own meals"
  ON public.meals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own meals" ON public.meals;
CREATE POLICY "Users can delete own meals"
  ON public.meals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. DAILY METRICS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can read own daily metrics" ON public.daily_metrics;
CREATE POLICY "Users can read own daily metrics"
  ON public.daily_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily metrics" ON public.daily_metrics;
CREATE POLICY "Users can insert own daily metrics"
  ON public.daily_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily metrics" ON public.daily_metrics;
CREATE POLICY "Users can update own daily metrics"
  ON public.daily_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. SOCIAL POSTS, LIKES & COMMENTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Public posts are viewable by all authenticated users" ON public.social_posts;
CREATE POLICY "Public posts are viewable by all authenticated users"
  ON public.social_posts FOR SELECT
  TO authenticated
  USING (visibility = 'public' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own posts" ON public.social_posts;
CREATE POLICY "Users can create their own posts"
  ON public.social_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.social_posts;
CREATE POLICY "Users can delete their own posts"
  ON public.social_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Post Likes
DROP POLICY IF EXISTS "Likes are viewable by authenticated users" ON public.post_likes;
CREATE POLICY "Likes are viewable by authenticated users"
  ON public.post_likes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can toggle their own like" ON public.post_likes;
CREATE POLICY "Users can toggle their own like"
  ON public.post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own like" ON public.post_likes;
CREATE POLICY "Users can remove their own like"
  ON public.post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Post Comments
DROP POLICY IF EXISTS "Comments are viewable by authenticated users" ON public.post_comments;
CREATE POLICY "Comments are viewable by authenticated users"
  ON public.post_comments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can post comments" ON public.post_comments;
CREATE POLICY "Users can post comments"
  ON public.post_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.post_comments;
CREATE POLICY "Users can delete own comments"
  ON public.post_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. FOLLOWS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Follows are viewable by authenticated users" ON public.follows;
CREATE POLICY "Follows are viewable by authenticated users"
  ON public.follows FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- ============================================================================
-- 7. GROUP CIRCLES & NUDGES POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Group circles viewable by members" ON public.group_circles;
CREATE POLICY "Group circles viewable by members"
  ON public.group_circles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create a group circle" ON public.group_circles;
CREATE POLICY "Authenticated users can create a group circle"
  ON public.group_circles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Group Members
DROP POLICY IF EXISTS "Group members viewable by authenticated users" ON public.group_members;
CREATE POLICY "Group members viewable by authenticated users"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can join a group circle" ON public.group_members;
CREATE POLICY "Users can join a group circle"
  ON public.group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Group Nudges
DROP POLICY IF EXISTS "Nudges viewable by group members" ON public.group_nudges;
CREATE POLICY "Nudges viewable by group members"
  ON public.group_nudges FOR SELECT
  TO authenticated
  USING (auth.uid() = target_user_id OR auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can send nudges" ON public.group_nudges;
CREATE POLICY "Users can send nudges"
  ON public.group_nudges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- ============================================================================
-- 8. VOUCHERS & WALLET POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Available vouchers viewable by all authenticated users" ON public.vouchers;
CREATE POLICY "Available vouchers viewable by all authenticated users"
  ON public.vouchers FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Users can view only their own claimed vouchers" ON public.claimed_vouchers;
CREATE POLICY "Users can view only their own claimed vouchers"
  ON public.claimed_vouchers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can claim vouchers" ON public.claimed_vouchers;
CREATE POLICY "Users can claim vouchers"
  ON public.claimed_vouchers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Daily Missions
DROP POLICY IF EXISTS "Users can view own daily missions" ON public.daily_missions;
CREATE POLICY "Users can view own daily missions"
  ON public.daily_missions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily missions" ON public.daily_missions;
CREATE POLICY "Users can insert own daily missions"
  ON public.daily_missions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily missions" ON public.daily_missions;
CREATE POLICY "Users can update own daily missions"
  ON public.daily_missions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

