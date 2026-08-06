-- ═══════════════════════════════════════════════════════════════════════════
-- CONSENT-NACHWEIS: Wortlaut der Einwilligung mitspeichern
-- DSGVO-Nachweispflicht: es reicht nicht, DASS jemand zugestimmt hat — man muss
-- belegen können, WELCHEM Text zugestimmt wurde. E-Mail, Zeitstempel (consent_at)
-- und Quelle (source/utm) sind bereits vorhanden.
-- Additiv + idempotent. Ziel-Projekt: zlmldahbtrwbemndclwm
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.reset_participants
  ADD COLUMN IF NOT EXISTS consent_text text;

COMMENT ON COLUMN public.reset_participants.consent_text IS
  'Exakter Wortlaut der Checkbox, der zum Zeitpunkt consent_at zugestimmt wurde (DSGVO-Nachweis).';
