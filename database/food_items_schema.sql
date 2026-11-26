-- ============================================================================
-- CalorieSnap - Food Items Nutrition Database Schema
-- Description: Consolidated table for OpenNutrition, MyFCD/TKPI, CNF 2026, and Open Food Facts
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_normalized TEXT NOT NULL,
    category TEXT,
    calories_per_100g NUMERIC(10, 2) NOT NULL,
    protein_per_100g NUMERIC(10, 2),
    carbs_per_100g NUMERIC(10, 2),
    fat_per_100g NUMERIC(10, 2),
    fiber_per_100g NUMERIC(10, 2),
    sugar_per_100g NUMERIC(10, 2),
    sodium_per_100g NUMERIC(10, 2),
    standard_serving_name TEXT,
    standard_serving_grams NUMERIC(10, 2),
    source TEXT NOT NULL,
    source_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Fast search & query indexes
CREATE INDEX IF NOT EXISTS idx_food_items_name_normalized ON public.food_items(name_normalized);
CREATE INDEX IF NOT EXISTS idx_food_items_source ON public.food_items(source);
CREATE INDEX IF NOT EXISTS idx_food_items_calories ON public.food_items(calories_per_100g);

-- Enable RLS and setup access policies
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on food_items" ON public.food_items;
CREATE POLICY "Allow public read access on food_items" 
  ON public.food_items FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow service role full access on food_items" ON public.food_items;
CREATE POLICY "Allow service role full access on food_items" 
  ON public.food_items FOR ALL 
  USING (true);
