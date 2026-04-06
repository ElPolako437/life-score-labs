-- Fix security issue: Remove overly permissive policy and add secure admin-only access

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Allow authenticated users to view anmeldungen" ON public."RunAndCoffeeAnmeldungen";

-- Create secure policy: Only admins can view registration data
CREATE POLICY "Only admins can view registrations" 
ON public."RunAndCoffeeAnmeldungen" 
FOR SELECT 
TO authenticated
USING (public.is_admin());

-- Add admin-only policies for update and delete (if not already exist)
DROP POLICY IF EXISTS "Only admins can update registrations" ON public."RunAndCoffeeAnmeldungen";
CREATE POLICY "Only admins can update registrations" 
ON public."RunAndCoffeeAnmeldungen" 
FOR UPDATE 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins can delete registrations" ON public."RunAndCoffeeAnmeldungen";
CREATE POLICY "Only admins can delete registrations" 
ON public."RunAndCoffeeAnmeldungen" 
FOR DELETE 
TO authenticated
USING (public.is_admin());