-- Add RLS policies for admin_access and admin_sessions tables
-- These tables should only be accessible via service role (edge functions)

-- No public access to admin_access - only service role can read/write
CREATE POLICY "No public access to admin_access"
ON public.admin_access
FOR ALL
USING (false);

-- No public access to admin_sessions - only service role can read/write  
CREATE POLICY "No public access to admin_sessions"
ON public.admin_sessions
FOR ALL
USING (false);