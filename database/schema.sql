-- ============================================================================
-- CalorieSnap - Complete Supabase Relational Database Schema
-- Group: A TTLS (UTM Group 1)
-- Authors: Aloysius Probo (Backend), Lee Hui Zhen (Frontend)
-- Description: Core schema supporting Auth, Meals, Vision AI, Metrics, Social Circles, Gamification
-- Note: Row Level Security (RLS) policies are defined in database/rls.sql
-- Safe Clean-Install: Drops partial/outdated tables and rebuilds fresh
-- ============================================================================

-- 0. CLEANUP EXISTING TABLES & TRIGGERS (Guarantees clean execution without column mismatch)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

DROP TABLE IF EXISTS public.group_nudges CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.group_circles CASCADE;
DROP TABLE IF EXISTS public.post_comments CASCADE;
DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.social_posts CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.claimed_vouchers CASCADE;
DROP TABLE IF EXISTS public.vouchers CASCADE;
DROP TABLE IF EXISTS public.daily_missions CASCADE;
DROP TABLE IF EXISTS public.daily_metrics CASCADE;
DROP TABLE IF EXISTS public.meals CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILES TABLE (Linked 1-to-1 with Supabase auth.users)
-- ============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT DEFAULT 'Uni life, good food & little wins',
  gender TEXT CHECK (gender IN ('Female', 'Male', 'Other')),
  age INT CHECK (age > 0 AND age < 120),
  height_cm NUMERIC(5, 2),
  current_weight_kg NUMERIC(5, 2),
  target_weight_kg NUMERIC(5, 2),
  activity_level TEXT CHECK (activity_level IN ('seated', 'light', 'moderate', 'very')),
  daily_calorie_target INT DEFAULT 1850,
  target_protein_g NUMERIC(5, 2) DEFAULT 90,
  target_carbs_g NUMERIC(5, 2) DEFAULT 180,
  target_fat_g NUMERIC(5, 2) DEFAULT 50,
  streak_days INT DEFAULT 1 CHECK (streak_days >= 0),
  snap_points INT DEFAULT 0 CHECK (snap_points >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Re-sync any existing auth users into profiles if any exist
INSERT INTO public.profiles (id, email, full_name, username)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'username', '@' || split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. MEALS TABLE (Logged meals from manual entry or AI Vision photo snaps)
-- ============================================================================
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Breakfast', 'Lunch', 'Dinner', 'Snacks')),
  calories INT NOT NULL CHECK (calories >= 0),
  protein_g NUMERIC(5, 2) DEFAULT 0,
  carbs_g NUMERIC(5, 2) DEFAULT 0,
  fat_g NUMERIC(5, 2) DEFAULT 0,
  portion_multiplier NUMERIC(3, 2) DEFAULT 1.0,
  image_url TEXT,
  ai_detected_tags JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT false,
  logged_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_meals_user_logged_at ON public.meals(user_id, logged_at DESC);

-- ============================================================================
-- 3. DAILY METRICS TABLE (Water hydration, steps count, gym workout)
-- ============================================================================
CREATE TABLE public.daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  water_ml INT DEFAULT 0 CHECK (water_ml >= 0),
  steps_count INT DEFAULT 0 CHECK (steps_count >= 0),
  workout_minutes INT DEFAULT 0 CHECK (workout_minutes >= 0),
  workout_calories_burned INT DEFAULT 0 CHECK (workout_calories_burned >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_daily_metrics UNIQUE (user_id, metric_date)
);

CREATE INDEX idx_daily_metrics_user_date ON public.daily_metrics(user_id, metric_date);

-- ============================================================================
-- 4. SOCIAL POSTS TABLE (Instagram-style Following & Discover feeds)
-- ============================================================================
CREATE TABLE public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES public.meals(id) ON DELETE SET NULL,
  caption TEXT,
  location_name TEXT DEFAULT 'Campus spot',
  image_url TEXT,
  calories INT,
  pct_daily_goal INT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'circle', 'private')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_social_posts_created_at ON public.social_posts(created_at DESC);

-- ============================================================================
-- 5. POST LIKES & COMMENTS
-- ============================================================================
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_post_user_like UNIQUE (post_id, user_id)
);

CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 6. FOLLOWS (Friend peer connections for "Following" tab)
-- ============================================================================
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_follower_following UNIQUE (follower_id, following_id),
  CONSTRAINT check_not_self_follow CHECK (follower_id <> following_id)
);

-- ============================================================================
-- 7. GROUP CIRCLES & NUDGES (Private squads e.g. "Roomie Diet Squad")
-- ============================================================================
CREATE TABLE public.group_circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  total_streak_days INT DEFAULT 0,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.group_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_group_member UNIQUE (group_id, user_id)
);

CREATE TABLE public.group_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.group_circles(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meal_slot TEXT NOT NULL CHECK (meal_slot IN ('Breakfast', 'Lunch', 'Dinner')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 8. GAMIFIED REWARDS, MISSIONS & VOUCHERS
-- ============================================================================
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  title TEXT NOT NULL,
  discount_label TEXT NOT NULL,
  points_cost INT NOT NULL CHECK (points_cost > 0),
  terms TEXT,
  color_hex TEXT DEFAULT '#DDF0D3',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.claimed_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  voucher_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
  claimed_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE public.daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mission_type TEXT NOT NULL CHECK (mission_type IN ('snap_3_meals', 'steps_8000', 'water_2000')),
  current_progress INT DEFAULT 0,
  target_progress INT NOT NULL,
  points_reward INT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  is_claimed BOOLEAN DEFAULT false,
  CONSTRAINT unique_user_mission_date UNIQUE (user_id, mission_date, mission_type)
);

-- ============================================================================
-- 9. AUTOMATIC USER PROFILE TRIGGER
-- Trigger that runs when a user registers via Supabase Auth (Email or Google)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    avatar_url,
    snap_points,
    streak_days
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', '@' || split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    100, -- 100 bonus starting SnapPoints
    1
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 10. SAMPLE INITIAL SEED DATA (For Immediate Testing)
-- ============================================================================
INSERT INTO public.vouchers (brand, title, discount_label, points_cost, terms, color_hex)
VALUES
  ('Salad Atelier', 'RM5 Off Salad Atelier', 'RM5 Off', 500, 'Valid at all campus and mall outlets. Min spend RM15.', '#DDF0D3'),
  ('Boost Juice', '15% Off Boost Juice', '15% Off', 650, 'Valid for all Original sized smoothies and crushes.', '#D8EDF8'),
  ('Tealive', 'Tealive Free Upsize', 'Free Upsize', 300, 'Upgrade from Regular to Large on any signature milk tea.', '#FFEFA0')
ON CONFLICT DO NOTHING;
