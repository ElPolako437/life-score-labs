-- Add marketing consent column to bioage_submissions
ALTER TABLE bioage_submissions 
  ADD COLUMN IF NOT EXISTS consent_email_marketing BOOLEAN DEFAULT false;

-- Add marketing consent column to bio_age_results
ALTER TABLE bio_age_results 
  ADD COLUMN IF NOT EXISTS consent_email_marketing BOOLEAN DEFAULT false;