ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS premium_source text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS premium_until timestamptz,
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';