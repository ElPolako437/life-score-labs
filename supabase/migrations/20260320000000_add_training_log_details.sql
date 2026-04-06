-- Add optional source and note columns to training_logs
ALTER TABLE public.training_logs
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS note text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plan_session_type text DEFAULT NULL;
