-- Create storage bucket for evaluation PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('evaluations', 'evaluations', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to evaluation PDFs
CREATE POLICY "Public can read evaluation PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'evaluations');

-- Allow authenticated uploads via service role (edge functions)
CREATE POLICY "Service role can upload evaluation PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'evaluations');