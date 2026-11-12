-- ============================================================================
-- CalorieSnap - Comprehensive Seed Data & Malaysian Food Composition Database
-- Group: A TTLS (UTM Group 1)
-- Description:
--   1. Malaysian & Campus Food Catalog (with accurate verified macros)
--   2. Extended Campus Brand Vouchers
--   3. Gamified Daily Missions
--   4. Campus Squad Circles & Demo Social Posts
-- Run Order: Run this script AFTER schema.sql, rls.sql and functions.sql.
-- ============================================================================

-- ============================================================================
-- 1. MALAYSIAN & CAMPUS FOOD COMPOSITION CATALOG
-- Reference database of common Malaysian university meals, hawker foods, and drinks.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.food_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages')),
  calories INT NOT NULL CHECK (calories >= 0),
  protein_g NUMERIC(5, 2) NOT NULL DEFAULT 0,
  carbs_g NUMERIC(5, 2) NOT NULL DEFAULT 0,
  fat_g NUMERIC(5, 2) NOT NULL DEFAULT 0,
  serving_size TEXT NOT NULL,
  location_hint TEXT DEFAULT 'Campus Cafe / Hawker',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.food_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view food catalog" ON public.food_catalog;
CREATE POLICY "Anyone can view food catalog"
  ON public.food_catalog FOR SELECT
  TO authenticated, anon
  USING (true);

INSERT INTO public.food_catalog (name, category, calories, protein_g, carbs_g, fat_g, serving_size, location_hint, tags)
VALUES
  -- Breakfast
  ('Roti Canai with Dhal Curry', 'Breakfast', 360, 8.5, 48.0, 15.0, '1 piece with 1 small bowl dhal', 'Mamak / Arked Meranti', ARRAY['mamak', 'halal', 'vegetarian']),
  ('Half-Boiled Eggs on Toast (2 eggs)', 'Breakfast', 280, 15.0, 26.0, 12.0, '2 eggs + 2 slices butter toast', 'Kopitiam', ARRAY['high-protein', 'breakfast']),
  ('Oatmeal with Banana & Honey', 'Breakfast', 310, 11.5, 54.0, 5.5, '1 medium bowl (250g)', 'Home / Cafe', ARRAY['healthy', 'fiber', 'clean']),
  ('Nasi Lemak Biasa (Bungkus)', 'Breakfast', 430, 9.0, 58.0, 18.0, '1 packet (with egg, cucumber, sambal)', 'Stall / Campus Mart', ARRAY['classic', 'local']),
  ('Chee Cheong Fun with Sweet Sauce', 'Breakfast', 260, 4.0, 52.0, 4.0, '1 plate (2 rolls)', 'Hawker', ARRAY['hawker', 'light']),

  -- Lunch
  ('Hainanese Chicken Rice (Steamed)', 'Lunch', 560, 34.0, 62.0, 17.0, '1 plate with soup and cucumber', 'Campus Food Court', ARRAY['high-protein', 'balanced', 'popular']),
  ('Hainanese Chicken Rice (Roasted)', 'Lunch', 610, 33.0, 63.0, 23.0, '1 plate with soup and chili', 'Campus Food Court', ARRAY['popular', 'lunch']),
  ('Nasi Lemak Ayam Goreng Berempah', 'Lunch', 760, 36.0, 72.0, 35.0, '1 plate with whole chicken piece', 'Arked Cengal / Meranti', ARRAY['cheat-meal', 'high-protein', 'local']),
  ('Nasi Campur (Ayam Kunyit + Sayur Campur)', 'Lunch', 520, 32.0, 55.0, 16.0, '1 plate (1 cup rice, 1 chicken, 1 veg)', 'Warung Melayu', ARRAY['balanced', 'clean', 'student-budget']),
  ('Char Kway Teow with Cockles & Egg', 'Lunch', 740, 22.0, 78.0, 38.0, '1 medium plate', 'Night Market / Hawker', ARRAY['hawker', 'high-carb']),
  ('Mee Goreng Mamak', 'Lunch', 660, 18.0, 82.0, 28.0, '1 plate with tofu & egg', 'Mamak Stall', ARRAY['mamak', 'spicy']),
  ('Subway 6-inch Roasted Chicken Sub', 'Lunch', 320, 23.0, 42.0, 5.0, '6-inch sub on wheat with salad', 'Mall / Campus Sub', ARRAY['healthy', 'low-fat', 'clean']),
  ('Salad Atelier Salmon Nourish Bowl', 'Lunch', 490, 32.0, 42.0, 20.0, '1 bowl with quinoa and mixed greens', 'Salad Atelier', ARRAY['healthy', 'omega3', 'keto-friendly']),

  -- Dinner
  ('Laksa Johor', 'Dinner', 580, 26.0, 68.0, 22.0, '1 bowl with spaghetti and fish gravy', 'Johor Cafe', ARRAY['johor-specialty', 'soup']),
  ('Tom Yum Soup with Chicken & Steamed Rice', 'Dinner', 450, 28.0, 52.0, 12.0, '1 bowl soup + 1 cup rice', 'Thai Warung', ARRAY['low-fat', 'spicy', 'comfort-food']),
  ('Nasi Goreng Kampung with Fried Egg', 'Dinner', 620, 19.0, 74.0, 26.0, '1 plate with kangkung & ikan bilis', 'Mamak / Warung', ARRAY['classic', 'dinner']),
  ('Beef Rendang with White Rice', 'Dinner', 680, 38.0, 65.0, 27.0, '1 plate with 3 beef cubes & gravy', 'Malay Restaurant', ARRAY['high-protein', 'flavorful']),
  ('Chicken Souvlaki / Kebab Wrap', 'Dinner', 480, 29.0, 46.0, 18.0, '1 regular roll with garlic yogurt', 'Mediterranean Spot', ARRAY['balanced', 'quick']),

  -- Snacks & Desserts
  ('Pisang Goreng (3 pieces)', 'Snacks', 270, 2.5, 38.0, 12.5, '3 medium pieces', 'Stall', ARRAY['street-food', 'sweet']),
  ('Curry Puff (Karipap Kentang & Telur)', 'Snacks', 210, 4.0, 24.0, 11.0, '1 medium piece', 'Bakery / Stall', ARRAY['snack']),
  ('FamilyMart Oden Set (4 skewers in Tom Yum)', 'Snacks', 240, 16.0, 22.0, 8.0, 'Daiko, fish cake, boiled egg, tofu', 'FamilyMart', ARRAY['low-calorie', 'warm', 'quick']),
  ('Greek Yogurt with Berries & Granola', 'Snacks', 220, 17.0, 26.0, 4.5, '1 small bowl (180g)', 'Convenience Store', ARRAY['high-protein', 'fitness']),

  -- Beverages
  ('Teh Tarik (Kurang Manis)', 'Beverages', 130, 3.0, 22.0, 3.5, '1 mug (250ml)', 'Mamak', ARRAY['drinks', 'local']),
  ('Teh O Ais Kosong (Unsweetened Iced Tea)', 'Beverages', 2, 0.0, 0.5, 0.0, '1 glass (350ml)', 'All Stalls', ARRAY['zero-calorie', 'hydration', 'clean']),
  ('Kopi O (Regular Sweetness)', 'Beverages', 90, 1.0, 19.0, 1.0, '1 cup (200ml)', 'Kopitiam', ARRAY['caffeine', 'drinks']),
  ('Milo Ais (Hawker Style)', 'Beverages', 210, 5.0, 34.0, 6.0, '1 glass with condensed milk', 'Mamak', ARRAY['classic', 'sweet']),
  ('Zus Coffee Iced Americano', 'Beverages', 10, 0.5, 1.5, 0.0, 'Regular cup', 'Zus Coffee', ARRAY['zero-calorie', 'caffeine', 'fitness']),
  ('Boost Juice All Berry Bang (Original)', 'Beverages', 275, 4.0, 62.0, 1.0, '1 original size cup (650ml)', 'Boost Juice', ARRAY['fruit', 'smoothie'])
ON CONFLICT (name) DO UPDATE SET
  calories = EXCLUDED.calories,
  protein_g = EXCLUDED.protein_g,
  carbs_g = EXCLUDED.carbs_g,
  fat_g = EXCLUDED.fat_g,
  serving_size = EXCLUDED.serving_size;

-- ============================================================================
-- 2. EXPANDED VOUCHERS CATALOG
-- ============================================================================
INSERT INTO public.vouchers (brand, title, discount_label, points_cost, terms, color_hex, is_active)
VALUES
  ('Salad Atelier', 'RM5 Off Salad Atelier', 'RM5 Off', 500, 'Valid at all campus and mall outlets. Min spend RM15.', '#DDF0D3', true),
  ('Boost Juice', '15% Off Boost Juice', '15% Off', 650, 'Valid for all Original sized smoothies and crushes.', '#D8EDF8', true),
  ('Tealive', 'Tealive Free Upsize', 'Free Upsize', 300, 'Upgrade from Regular to Large on any signature milk tea.', '#FFEFA0', true),
  ('Subway', 'Subway 20% Off 6-inch Healthy Meal', '20% Off', 800, 'Valid with purchase of any 6-inch sub and 1 bottle water.', '#DDF0D3', true),
  ('FamilyMart', 'RM3 Off FamilyMart Oden Bowl', 'RM3 Off', 450, 'Valid for any Oden bowl with minimum 4 skewers.', '#FDE2D2', true),
  ('Zus Coffee', 'RM2 Off Zus Clean Brew', 'RM2 Off', 350, 'Valid for Americano, Cold Brew, or Cham Espresso.', '#E0E7FF', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. DEMO GROUP CIRCLES (Campus Wellness Squads)
-- ============================================================================
DO $$
DECLARE
  v_first_user UUID;
BEGIN
  -- Check if at least one profile exists in public.profiles
  SELECT id INTO v_first_user FROM public.profiles LIMIT 1;

  IF v_first_user IS NOT NULL THEN
    -- Seed demo circles
    INSERT INTO public.group_circles (name, description, invite_code, total_streak_days, created_by)
    VALUES
      ('Roomie Diet Squad', 'Keeping each other accountable on clean macros & 2L daily water.', 'ROOMIE2026', 14, v_first_user),
      ('UTM Meranti Walkers', 'Post-lunch walk squad around UTM campus. Target 8,000 steps daily.', 'MERANTI8K', 21, v_first_user)
    ON CONFLICT (invite_code) DO NOTHING;

    -- Add creator as admin member
    INSERT INTO public.group_members (group_id, user_id, role)
    SELECT id, v_first_user, 'admin'
    FROM public.group_circles
    WHERE invite_code IN ('ROOMIE2026', 'MERANTI8K')
    ON CONFLICT (group_id, user_id) DO NOTHING;

    -- Seed sample social posts
    INSERT INTO public.social_posts (user_id, caption, location_name, calories, pct_daily_goal, visibility)
    VALUES
      (
        v_first_user,
        'Nasi campur with steamed chicken breast, pak choy & tauhu goreng. Staying clean before evening badminton 🏸',
        'Arked Meranti, UTM',
        520,
        28,
        'public'
      ),
      (
        v_first_user,
        'Post-workout meal: Subway 6-inch roasted chicken with sweet onion sauce and bottled water! 💪',
        'UTM Scholar''s Inn',
        340,
        18,
        'public'
      )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

