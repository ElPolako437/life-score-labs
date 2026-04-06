CREATE TABLE public.weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_key text NOT NULL,
  report_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_key)
);

ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own reports" ON public.weekly_reports FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own reports" ON public.weekly_reports FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own reports" ON public.weekly_reports FOR UPDATE TO authenticated USING (user_id = auth.uid());