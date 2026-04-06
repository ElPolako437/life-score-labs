-- Fix security issue: Restrict access to RunAndCoffeeAnmeldungen table

-- First, drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Allow authenticated users to view anmeldungen" ON public."RunAndCoffeeAnmeldungen";

-- Create a user roles system for proper access control
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table to manage user permissions
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
$$;

-- Create secure RLS policy for RunAndCoffeeAnmeldungen - only admins can view registrations
CREATE POLICY "Only admins can view registrations" 
ON public."RunAndCoffeeAnmeldungen" 
FOR SELECT 
TO authenticated
USING (public.is_admin());

-- Allow admins to manage registrations (update/delete if needed)
CREATE POLICY "Only admins can update registrations" 
ON public."RunAndCoffeeAnmeldungen" 
FOR UPDATE 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete registrations" 
ON public."RunAndCoffeeAnmeldungen" 
FOR DELETE 
TO authenticated
USING (public.is_admin());

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Only admins can manage user roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create function to assign admin role (for initial setup)
CREATE OR REPLACE FUNCTION public.make_user_admin(_user_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
$$;