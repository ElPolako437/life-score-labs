-- Add new columns for result level, GDPR consent, and meeting tracking
ALTER TABLE public.bioage_submissions 
ADD COLUMN IF NOT EXISTS result_level text,
ADD COLUMN IF NOT EXISTS gdpr_consent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_timestamp timestamp with time zone,
ADD COLUMN IF NOT EXISTS meeting_booked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notes text;

-- Also add to bio_age_results for completeness
ALTER TABLE public.bio_age_results
ADD COLUMN IF NOT EXISTS result_level text,
ADD COLUMN IF NOT EXISTS gdpr_consent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_timestamp timestamp with time zone,
ADD COLUMN IF NOT EXISTS meeting_booked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notes text;

-- Create admin_access table to store admin password hash
CREATE TABLE IF NOT EXISTS public.admin_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on admin_access
ALTER TABLE public.admin_access ENABLE ROW LEVEL SECURITY;

-- Create admin sessions table to track logged-in admin sessions
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL
);

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Admin can read bioage_submissions via session token validation
-- We'll handle this in the edge function for security

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bioage_submissions_result_level ON public.bioage_submissions(result_level);
CREATE INDEX IF NOT EXISTS idx_bioage_submissions_created_at ON public.bioage_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bioage_submissions_meeting_booked ON public.bioage_submissions(meeting_booked);