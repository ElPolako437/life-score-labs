ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS nutrition_targets jsonb;
