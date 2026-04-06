-- Create bio_age_results table for storing Bio-Age test results
CREATE TABLE public.bio_age_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT,
  email TEXT NOT NULL,
  real_age INTEGER NOT NULL,
  bio_age INTEGER NOT NULL,
  result_text TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.bio_age_results ENABLE ROW LEVEL SECURITY;

-- Create policies for bio_age_results
CREATE POLICY "Allow anyone to insert bio age results" 
ON public.bio_age_results 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view bio age results" 
ON public.bio_age_results 
FOR SELECT 
USING (auth.uid() IS NOT NULL);