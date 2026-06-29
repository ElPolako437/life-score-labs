-- ═══════════════════════════════════════════════════════════════════════════
-- RESET ADMIN BACKEND — Datenmodell (Phase 2)
-- Additiv & idempotent (mehrfach ausführbar). Macht den Reset-Funnel server-
-- seitig auswertbar: Lead-CRM-Felder, Startprofil, Tagesfortschritt/Ratings,
-- eigenes Event-Log, Admin-Notizen.
-- SICHERHEIT: alle neuen Tabellen sind RLS-locked (keine Policies) → Zugriff
-- ausschließlich über Service-Role (Edge Functions / Admin-Token). Nichts ist
-- öffentlich lesbar. Sensible Felder (Gewicht/Größe/Alter/E-Mail) bleiben dicht.
-- Ziel-Projekt: zlmldahbtrwbemndclwm
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Wiederverwendbarer updated_at-Trigger ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.reset_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

-- ── 1) reset_participants: CRM-/Funnel-Felder ergänzen ─────────────────────
ALTER TABLE public.reset_participants
  ADD COLUMN IF NOT EXISTS updated_at        timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS completed_at      timestamptz,
  ADD COLUMN IF NOT EXISTS reset_status      text NOT NULL DEFAULT 'started',  -- started|active|completed|abandoned
  ADD COLUMN IF NOT EXISTS contact_status    text NOT NULL DEFAULT 'new',      -- new|contacted|coaching_ready|not_relevant
  ADD COLUMN IF NOT EXISTS coaching_interest text NOT NULL DEFAULT 'low',      -- low|medium|high
  ADD COLUMN IF NOT EXISTS app_interest      text NOT NULL DEFAULT 'low',      -- low|medium|high
  ADD COLUMN IF NOT EXISTS readiness_score   int  NOT NULL DEFAULT 0;          -- 0-100 (gecached, im Capture aktualisiert)

DROP TRIGGER IF EXISTS trg_reset_participants_updated ON public.reset_participants;
CREATE TRIGGER trg_reset_participants_updated
  BEFORE UPDATE ON public.reset_participants
  FOR EACH ROW EXECUTE FUNCTION public.reset_set_updated_at();

CREATE INDEX IF NOT EXISTS reset_participants_reset_status_idx   ON public.reset_participants(reset_status);
CREATE INDEX IF NOT EXISTS reset_participants_contact_status_idx ON public.reset_participants(contact_status);
CREATE INDEX IF NOT EXISTS reset_participants_readiness_idx      ON public.reset_participants(readiness_score DESC);
CREATE INDEX IF NOT EXISTS reset_participants_last_seen_idx      ON public.reset_participants(last_seen_at DESC);

-- ── 2) reset_profiles: Tag-1 Startprofil (1:1 je E-Mail) ───────────────────
CREATE TABLE IF NOT EXISTS public.reset_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL UNIQUE,
  sex          text,
  age          int,
  height       int,
  weight       numeric,
  activity     text,
  daily        text,
  goal         text,
  hurdle       text,
  baseline     jsonb NOT NULL DEFAULT '{}'::jsonb,
  bmr          int,
  tdee         int,
  cal_low      int,
  cal_high     int,
  protein_low  int,
  protein_high int,
  meal_count   int,
  main_lever   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_reset_profiles_updated ON public.reset_profiles;
CREATE TRIGGER trg_reset_profiles_updated
  BEFORE UPDATE ON public.reset_profiles
  FOR EACH ROW EXECUTE FUNCTION public.reset_set_updated_at();

-- ── 3) reset_day_progress: pro Tag (1:n, unique je E-Mail+Tag) ─────────────
CREATE TABLE IF NOT EXISTS public.reset_day_progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL,
  day          int  NOT NULL,                      -- 1..7
  task_done    boolean NOT NULL DEFAULT false,
  rating       int,                                -- 1..5
  tool_result  jsonb NOT NULL DEFAULT '{}'::jsonb, -- Tagesergebnis (Profil/Meals/Steps/Sleep/Saboteur/Week)
  freetext     text,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, day)
);
DROP TRIGGER IF EXISTS trg_reset_day_progress_updated ON public.reset_day_progress;
CREATE TRIGGER trg_reset_day_progress_updated
  BEFORE UPDATE ON public.reset_day_progress
  FOR EACH ROW EXECUTE FUNCTION public.reset_set_updated_at();
CREATE INDEX IF NOT EXISTS reset_day_progress_email_idx ON public.reset_day_progress(email);
CREATE INDEX IF NOT EXISTS reset_day_progress_day_idx   ON public.reset_day_progress(day);

-- ── 4) reset_events: eigenes CTA-/Funnel-Event-Log (1:n) ───────────────────
CREATE TABLE IF NOT EXISTS public.reset_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text,                                 -- null = anonym (vor Signup)
  anon_id    text,                                 -- stabiler Client-Identifier für anonyme Events
  event      text NOT NULL,                        -- reset_started | profile_calculated | day_completed | rating_submitted | sprint_cta_clicked | ...
  payload    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reset_events_email_idx   ON public.reset_events(email);
CREATE INDEX IF NOT EXISTS reset_events_event_idx   ON public.reset_events(event);
CREATE INDEX IF NOT EXISTS reset_events_created_idx ON public.reset_events(created_at DESC);

-- ── 5) admin_notes: Follow-up-Notizen je Lead (1:n) ────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  note       text NOT NULL,
  author     text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_notes_email_idx ON public.admin_notes(email);

-- ── RLS: alles dicht — nur Service-Role (Edge Functions / Admin-Token) ──────
-- Keine Policies = anon/authenticated kommen NICHT dran. Service-Role umgeht RLS.
ALTER TABLE public.reset_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reset_day_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reset_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes        ENABLE ROW LEVEL SECURITY;
