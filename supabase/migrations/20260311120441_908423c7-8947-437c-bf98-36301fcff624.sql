
-- Block B: goal_plans extension
ALTER TABLE public.goal_plans
  ADD COLUMN IF NOT EXISTS active_pillars text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pillar_activation_dates jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pillar_activation_answers jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS nutrition_plan jsonb,
  ADD COLUMN IF NOT EXISTS training_plan_data jsonb,
  ADD COLUMN IF NOT EXISTS recovery_tips jsonb,
  ADD COLUMN IF NOT EXISTS mental_tips jsonb,
  ADD COLUMN IF NOT EXISTS plan_checkin_history jsonb DEFAULT '{}';

-- Block C: Unique constraints for upserts
ALTER TABLE public.daily_checkins
  ADD CONSTRAINT daily_checkins_user_date_unique UNIQUE (user_id, date);

ALTER TABLE public.score_history
  ADD CONSTRAINT score_history_user_date_unique UNIQUE (user_id, date);

ALTER TABLE public.weight_entries
  ADD CONSTRAINT weight_entries_user_date_unique UNIQUE (user_id, date);

ALTER TABLE public.wearable_entries
  ADD CONSTRAINT wearable_entries_user_date_unique UNIQUE (user_id, date);

-- Missing nutrition_logs UPDATE policy
CREATE POLICY "Users update own nutrition"
  ON public.nutrition_logs FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
