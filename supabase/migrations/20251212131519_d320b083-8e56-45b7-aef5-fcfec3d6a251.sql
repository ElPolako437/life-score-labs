-- Add user-specific RLS policy for bio_age_results
-- Users can view their own results by matching their JWT email
CREATE POLICY "Users can view their own bio age results"
ON public.bio_age_results
FOR SELECT
USING (email = auth.jwt()->>'email');