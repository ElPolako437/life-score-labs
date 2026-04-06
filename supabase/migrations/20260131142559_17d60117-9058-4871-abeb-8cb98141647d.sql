-- Create table to store failed Brevo sync attempts for retry
CREATE TABLE public.brevo_sync_failures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  firstname TEXT,
  error_message TEXT,
  error_status INTEGER,
  newsletter_optin BOOLEAN DEFAULT FALSE,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.brevo_sync_failures ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access (for edge functions)
-- No public policies needed since this is internal
CREATE POLICY "Service role only" 
ON public.brevo_sync_failures 
FOR ALL 
USING (false);

-- Index for finding unresolved failures
CREATE INDEX idx_brevo_sync_failures_unresolved 
ON public.brevo_sync_failures (created_at) 
WHERE resolved_at IS NULL;

-- Index for counting today's syncs
CREATE INDEX idx_brevo_sync_failures_created 
ON public.brevo_sync_failures (created_at DESC);