
CREATE TABLE IF NOT EXISTS public.companion_evolution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evolution_tier text NOT NULL DEFAULT 'seed',
  evolution_progress numeric NOT NULL DEFAULT 0,
  vitality numeric NOT NULL DEFAULT 0,
  total_checkins integer NOT NULL DEFAULT 0,
  best_streak integer NOT NULL DEFAULT 0,
  unlocked_at jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.companion_evolution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own companion" ON public.companion_evolution
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users insert own companion" ON public.companion_evolution
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own companion" ON public.companion_evolution
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
