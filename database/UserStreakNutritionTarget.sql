-- ============================================================================
-- CalorieSnap - Backend Business Logic & RPC Functions
-- Group: A TTLS (UTM Group 1)
-- Description: Extracted algorithms from RiceCal & clinical nutrition formulas:
--  1. calculate_user_streak() - Gaps & islands algorithm (streak persists until breakfast)
--  2. calculate_nutrition_targets() - Mifflin-St Jeor + Adjusted Body Weight protein (1.6 g/kg)
--  3. sync_user_daily_metrics() - Automatic aggregation of today's consumed macros
-- ============================================================================

-- ============================================================================
-- 1. STREAK CALCULATION (Gaps & Islands Algorithm)
-- Accepts consecutive days ending TODAY or YESTERDAY so the streak doesn't
-- display 0 every morning before the user logs breakfast.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculate_user_streak(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  current_streak INT,
  longest_streak INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH distinct_days AS (
    SELECT DISTINCT logged_at::DATE AS log_date
    FROM public.meals
    WHERE user_id = p_user_id
  ),
  islands AS (
    SELECT
      log_date,
      log_date - (ROW_NUMBER() OVER (ORDER BY log_date))::INT AS island_group
    FROM distinct_days
  ),
  runs AS (
    SELECT
      COUNT(*)::INT AS streak_length,
      MAX(log_date) AS streak_ended_on
    FROM islands
    GROUP BY island_group
  )
  SELECT
    COALESCE(
      MAX(streak_length) FILTER (WHERE streak_ended_on >= CURRENT_DATE - INTERVAL '1 day'),
      0
    )::INT AS current_streak,
    COALESCE(MAX(streak_length), 0)::INT AS longest_streak
  FROM runs;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_user_streak(UUID) TO authenticated;

-- ============================================================================
-- 2. CLINICAL NUTRITION TARGETS (Mifflin-St Jeor + Adjusted Body Weight)
-- Calculates BMR, TDEE, Calories, Protein, Carbs, and Fat based on user metrics.
-- Protein is calculated at 1.6g/kg of Adjusted Body Weight (BMI 25 anchor).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculate_nutrition_targets(
  p_gender TEXT,
  p_age INT,
  p_weight_kg NUMERIC,
  p_height_cm NUMERIC,
  p_activity_level TEXT,
  p_goal TEXT DEFAULT 'maintain' -- 'loss', 'maintain', 'gain'
)
RETURNS TABLE (
  daily_calories INT,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  bmr INT,
  tdee INT
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_bmr NUMERIC;
  v_multiplier NUMERIC;
  v_tdee NUMERIC;
  v_target_calories INT;
  v_height_m NUMERIC;
  v_ibw NUMERIC; -- Ideal Body Weight at BMI 25
  v_adj_weight NUMERIC;
  v_protein NUMERIC;
  v_fat NUMERIC;
  v_carbs NUMERIC;
  v_remaining_kcal NUMERIC;
BEGIN
  -- 1. Calculate BMR (Mifflin-St Jeor)
  IF LOWER(p_gender) = 'female' THEN
    v_bmr := (10 * p_weight_kg) + (6.25 * p_height_cm) - (5 * p_age) - 161;
  ELSE
    v_bmr := (10 * p_weight_kg) + (6.25 * p_height_cm) - (5 * p_age) + 5;
  END IF;

  -- 2. Activity Multiplier
  CASE LOWER(p_activity_level)
    WHEN 'seated', 'sedentary' THEN v_multiplier := 1.20;
    WHEN 'light' THEN v_multiplier := 1.375;
    WHEN 'moderate' THEN v_multiplier := 1.55;
    WHEN 'very', 'veryactive' THEN v_multiplier := 1.725;
    ELSE v_multiplier := 1.375;
  END CASE;

  v_tdee := v_bmr * v_multiplier;

  -- 3. Goal Adjustment (-500 for loss, +300 for gain)
  CASE LOWER(p_goal)
    WHEN 'loss', 'lose' THEN v_target_calories := ROUND(v_tdee - 500);
    WHEN 'gain' THEN v_target_calories := ROUND(v_tdee + 300);
    ELSE v_target_calories := ROUND(v_tdee);
  END CASE;

  -- Safety bounds (minimum 1200 kcal floor, 10000 kcal ceiling)
  IF v_target_calories < 1200 THEN v_target_calories := 1200; END IF;
  IF v_target_calories > 10000 THEN v_target_calories := 10000; END IF;

  -- 4. Protein per Adjusted Body Weight (1.6 g/kg)
  v_height_m := p_height_cm / 100.0;
  v_ibw := 25.0 * (v_height_m * v_height_m);
  IF p_weight_kg > v_ibw THEN
    v_adj_weight := v_ibw + 0.25 * (p_weight_kg - v_ibw);
  ELSE
    v_adj_weight := p_weight_kg;
  END IF;
  v_protein := ROUND(v_adj_weight * 1.6);

  -- 5. Fat (25% of total calories, 9 kcal/g)
  v_fat := ROUND((v_target_calories * 0.25) / 9.0);

  -- 6. Carbs (Remaining calories, 4 kcal/g)
  v_remaining_kcal := v_target_calories - (v_protein * 4.0) - (v_fat * 9.0);
  IF v_remaining_kcal < 0 THEN v_remaining_kcal := 0; END IF;
  v_carbs := ROUND(v_remaining_kcal / 4.0);

  RETURN QUERY SELECT
    v_target_calories,
    v_protein,
    v_carbs,
    v_fat,
    ROUND(v_bmr)::INT,
    ROUND(v_tdee)::INT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_nutrition_targets(TEXT, INT, NUMERIC, NUMERIC, TEXT, TEXT) TO authenticated, anon;

