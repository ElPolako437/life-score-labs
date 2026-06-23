-- ═══════════════════════════════════════════════════════════════════════════
-- RESET 5-DAY EMAIL NURTURE SEQUENCE
-- Tables: reset_subscribers, email_sends
-- Cron: daily 08:00 UTC trigger via pg_cron + pg_net
-- ═══════════════════════════════════════════════════════════════════════════

-- Extensions
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. reset_subscribers
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.reset_subscribers (
  id            uuid        primary key default gen_random_uuid(),
  email         text        not null,
  name          text,
  source        text        default 'reset_webapp',
  created_at    timestamptz not null default now(),
  converted_at  timestamptz,
  unsubscribed  boolean     not null default false,

  constraint reset_subscribers_email_unique unique (email)
);

alter table public.reset_subscribers enable row level security;

-- Only service_role can read/write (Edge Functions use service_role key)
-- No anon/authenticated policies → table is invisible to frontend
create policy "service_role_all"
  on public.reset_subscribers
  for all
  to service_role
  using (true)
  with check (true);

create index if not exists idx_reset_subscribers_email
  on public.reset_subscribers (lower(email));

create index if not exists idx_reset_subscribers_created_unsub
  on public.reset_subscribers (created_at)
  where unsubscribed = false;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. email_sends (idempotency log — shared across all email flows)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.email_sends (
  id          uuid        primary key default gen_random_uuid(),
  email       text        not null,
  email_type  text        not null,   -- e.g. 'reset_day0', 'reset_day4'
  sent_at     timestamptz not null default now(),
  message_id  text,                   -- Brevo messageId for debugging

  constraint email_sends_idempotent unique (email, email_type)
);

alter table public.email_sends enable row level security;

create policy "service_role_all"
  on public.email_sends
  for all
  to service_role
  using (true)
  with check (true);

create index if not exists idx_email_sends_email_type
  on public.email_sends (email, email_type);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. pg_cron job: daily at 08:00 UTC
--    Calls the Edge Function via pg_net http_post.
--    Uses SUPABASE_SERVICE_ROLE_KEY from vault (same pattern as other crons).
-- ───────────────────────────────────────────────────────────────────────────

-- Safely remove if it already exists (idempotent re-run)
select cron.unschedule('reset-sequence-daily')
  where exists (
    select 1 from cron.job where jobname = 'reset-sequence-daily'
  );

select cron.schedule(
  'reset-sequence-daily',
  '0 8 * * *',   -- daily 08:00 UTC
  $$
  select net.http_post(
    url := 'https://zlmldahbtrwbemndclwm.supabase.co/functions/v1/send-reset-sequence',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'SUPABASE_SERVICE_ROLE_KEY'
        limit 1
      )
    ),
    body := '{"trigger":"cron"}'::jsonb
  );
  $$
);
