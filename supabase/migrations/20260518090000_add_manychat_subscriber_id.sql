ALTER TABLE public.reset_participants
  ADD COLUMN IF NOT EXISTS manychat_subscriber_id text;
