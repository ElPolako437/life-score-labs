-- Create bio_age_results table for storing test results
CREATE TABLE public.bio_age_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  real_age INTEGER NOT NULL,
  bio_age INTEGER NOT NULL,
  result_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bio_age_results ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (test submissions don't require login)
CREATE POLICY "Anyone can insert bio_age_results" 
ON public.bio_age_results 
FOR INSERT 
WITH CHECK (true);

-- Create bioage_submissions table for detailed submission data
CREATE TABLE public.bioage_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  firstname TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  score_total INTEGER,
  user_age INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bioage_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts
CREATE POLICY "Anyone can insert bioage_submissions" 
ON public.bioage_submissions 
FOR INSERT 
WITH CHECK (true);