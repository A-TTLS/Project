-- ============================================================================
-- CalorieSnap - Weight Logs Schema & RLS Policies
-- Description: Tracks weight history over time for analytics and trend charting
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  weight_kg NUMERIC(5, 2) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
  note TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_recorded ON public.weight_logs(user_id, recorded_at DESC);

-- Enable Row Level Security
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Authenticated Users
DROP POLICY IF EXISTS "Users can read own weight logs" ON public.weight_logs;
CREATE POLICY "Users can read own weight logs"
  ON public.weight_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own weight logs" ON public.weight_logs;
CREATE POLICY "Users can insert own weight logs"
  ON public.weight_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own weight logs" ON public.weight_logs;
CREATE POLICY "Users can update own weight logs"
  ON public.weight_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own weight logs" ON public.weight_logs;
CREATE POLICY "Users can delete own weight logs"
  ON public.weight_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
