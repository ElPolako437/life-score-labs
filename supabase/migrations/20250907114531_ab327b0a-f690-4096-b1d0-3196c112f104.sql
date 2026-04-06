-- Fix security issue: Restrict bio_age_results access to admins only
-- Drop the current overly permissive policy
DROP POLICY "Allow authenticated users to view bio age results" ON public.bio_age_results;

-- Create new admin-only policy for viewing bio age results
CREATE POLICY "Only admins can view bio age results" 
ON public.bio_age_results 
FOR SELECT 
USING (public.is_admin());