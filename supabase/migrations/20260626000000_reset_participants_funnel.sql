-- ═══════════════════════════════════════════════════════════════════════════
-- RESET PARTICIPANTS — Funnel-Felder
-- Macht reset_participants zur serverseitigen Source-of-Truth des Funnels:
-- Fortschritt, Consent (DSGVO), UTM-Attribution, High-Intent-Signale.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.reset_participants
  ADD COLUMN IF NOT EXISTS last_day_reached int       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consent          boolean   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_at       timestamptz,
  ADD COLUMN IF NOT EXISTS utm              jsonb     NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS high_intent      jsonb     NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_seen_at     timestamptz;

-- Index for funnel queries (how far did people get)
CREATE INDEX IF NOT EXISTS reset_participants_last_day_idx
  ON public.reset_participants (last_day_reached);
