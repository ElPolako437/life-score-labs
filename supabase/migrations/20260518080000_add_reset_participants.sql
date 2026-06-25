-- ═══════════════════════════════════════════════════════════════════════════
-- RESET PARTICIPANTS TABLE
-- Stores opt-ins for the 7-Tage Reset email sequence
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.reset_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  vorname text,
  start_datum date NOT NULL DEFAULT CURRENT_DATE,
  ziel text,
  whatsapp_nummer text,
  mails_sent jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for the daily cron job (only queries active participants)
CREATE INDEX IF NOT EXISTS reset_participants_status_idx
  ON public.reset_participants (status)
  WHERE status = 'active';

-- Prevent duplicate opt-ins for the same email
CREATE UNIQUE INDEX IF NOT EXISTS reset_participants_email_unique
  ON public.reset_participants (email);

-- RLS: table is written from Edge Functions using service role key,
-- no user-facing reads needed → enable RLS but allow no direct user access
ALTER TABLE public.reset_participants ENABLE ROW LEVEL SECURITY;

-- Service role (Edge Functions) bypasses RLS automatically.
-- No additional policies needed for user-facing app.
