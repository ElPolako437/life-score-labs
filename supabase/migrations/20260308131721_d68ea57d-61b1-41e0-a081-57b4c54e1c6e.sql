-- ═══ CALINESS APP PERSISTENCE TABLES ═══

-- 1. user_profiles
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  age integer NOT NULL DEFAULT 30,
  gender text NOT NULL DEFAULT 'männlich',
  height integer NOT NULL DEFAULT 175,
  weight integer NOT NULL DEFAULT 80,
  goals text[] NOT NULL DEFAULT '{}',
  activity_level text NOT NULL DEFAULT 'moderat',
  sleep_quality text NOT NULL DEFAULT 'mittel',
  stress_level text NOT NULL DEFAULT 'mittel',
  onboarding_complete boolean NOT NULL DEFAULT false,
  current_streak integer NOT NULL DEFAULT 0,
  is_premium boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.user_profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users insert own profile" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.user_profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- 2. daily_checkins
CREATE TABLE public.daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  sleep_hours numeric NOT NULL DEFAULT 7,
  sleep_quality integer NOT NULL DEFAULT 5,
  energy integer NOT NULL DEFAULT 5,
  stress integer NOT NULL DEFAULT 5,
  mood integer NOT NULL DEFAULT 5,
  training boolean NOT NULL DEFAULT false,
  steps integer NOT NULL DEFAULT 0,
  protein_quality text NOT NULL DEFAULT 'okay',
  hydration text NOT NULL DEFAULT 'okay',
  recovery integer NOT NULL DEFAULT 5,
  alcohol boolean NOT NULL DEFAULT false,
  screen_time_night boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own checkins" ON public.daily_checkins FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own checkins" ON public.daily_checkins FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own checkins" ON public.daily_checkins FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 3. score_history
CREATE TABLE public.score_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  score numeric NOT NULL DEFAULT 50,
  pillar_bewegung numeric NOT NULL DEFAULT 50,
  pillar_ernaehrung numeric NOT NULL DEFAULT 50,
  pillar_regeneration numeric NOT NULL DEFAULT 50,
  pillar_mental numeric NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own scores" ON public.score_history FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own scores" ON public.score_history FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own scores" ON public.score_history FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 4. nutrition_logs
CREATE TABLE public.nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  meals jsonb NOT NULL DEFAULT '[]',
  estimated_protein_total numeric NOT NULL DEFAULT 0,
  quality_rating text NOT NULL DEFAULT 'okay',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own nutrition" ON public.nutrition_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own nutrition" ON public.nutrition_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 5. goal_plans
CREATE TABLE public.goal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type text NOT NULL DEFAULT '',
  goal_description text NOT NULL DEFAULT '',
  target_date text NOT NULL DEFAULT '',
  target_weeks integer NOT NULL DEFAULT 4,
  weekly_plan jsonb,
  realism_result jsonb,
  completed_blocks text[] NOT NULL DEFAULT '{}',
  reminders_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.goal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own goals" ON public.goal_plans FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own goals" ON public.goal_plans FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own goals" ON public.goal_plans FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own goals" ON public.goal_plans FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 6. coach_sessions
CREATE TABLE public.coach_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  messages jsonb NOT NULL DEFAULT '[]',
  memory_facts text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coach_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own coach" ON public.coach_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own coach" ON public.coach_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own coach" ON public.coach_sessions FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 7. weight_entries
CREATE TABLE public.weight_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  weight numeric NOT NULL,
  body_fat numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own weight" ON public.weight_entries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own weight" ON public.weight_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own weight" ON public.weight_entries FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 8. wearable_entries
CREATE TABLE public.wearable_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  steps integer,
  hrv numeric,
  resting_hr numeric,
  sleep_hours numeric,
  spo2 numeric,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.wearable_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own wearables" ON public.wearable_entries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own wearables" ON public.wearable_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own wearables" ON public.wearable_entries FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 9. habit_data
CREATE TABLE public.habit_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  habits jsonb NOT NULL DEFAULT '[]',
  habit_history jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.habit_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own habits" ON public.habit_data FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own habits" ON public.habit_data FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own habits" ON public.habit_data FOR UPDATE TO authenticated USING (user_id = auth.uid());