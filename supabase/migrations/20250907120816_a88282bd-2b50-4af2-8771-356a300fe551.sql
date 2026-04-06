-- Fix critical security issue: Restrict bioage_submissions access to admins only
-- Drop the current overly permissive policy that allows any authenticated user to view all submissions
DROP POLICY "Allow authenticated users to view bioage submissions" ON public.bioage_submissions;

-- Create new admin-only policy for viewing bioage submissions
CREATE POLICY "Only admins can view bioage submissions" 
ON public.bioage_submissions 
FOR SELECT 
USING (public.is_admin());