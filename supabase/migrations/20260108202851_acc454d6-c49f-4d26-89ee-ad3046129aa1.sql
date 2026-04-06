-- 1. Add explicit SELECT deny policy for bioage_submissions
CREATE POLICY "No public read access to submissions"
ON public.bioage_submissions FOR SELECT
USING (false);

-- 2. Add explicit SELECT deny policy for bio_age_results  
CREATE POLICY "No public read access to bio_age_results"
ON public.bio_age_results FOR SELECT
USING (false);

-- 3. Make evaluations bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'evaluations';

-- 4. Drop any existing public read policy on evaluations
DROP POLICY IF EXISTS "Public can read evaluation PDFs" ON storage.objects;

-- 5. Add restrictive storage policies
CREATE POLICY "No public access to evaluations"
ON storage.objects FOR SELECT
USING (bucket_id = 'evaluations' AND false);

CREATE POLICY "Service role can manage evaluations"
ON storage.objects FOR ALL
USING (bucket_id = 'evaluations')
WITH CHECK (bucket_id = 'evaluations');