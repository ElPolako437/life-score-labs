
-- Block A: New Tables

CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  pillar text NOT NULL CHECK (pillar IN ('bewegung','ernaehrung','regeneration','mental')),
  type text NOT NULL,
  label text NOT NULL,
  duration integer,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('plan','checkin','manual')),
  details jsonb,
  intensity text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_logs_user_date ON public.activity_logs(user_id, date);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own activities"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own activities"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own activities"
  ON public.activity_logs FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Badges
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id text NOT NULL,
  label text NOT NULL,
  emoji text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own badges"
  ON public.badges FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own badges"
  ON public.badges FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Training Logs
CREATE TABLE public.training_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  type text NOT NULL,
  duration integer NOT NULL DEFAULT 0,
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_training_logs_user_date ON public.training_logs(user_id, date);

ALTER TABLE public.training_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own training"
  ON public.training_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own training"
  ON public.training_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own training"
  ON public.training_logs FOR DELETE TO authenticated
  USING (user_id = auth.uid());
