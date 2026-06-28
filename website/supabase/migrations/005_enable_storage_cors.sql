-- Enable CORS for Supabase Storage buckets
-- This allows MediaPipe to process videos from cross-origin sources

-- Update the videos bucket to allow CORS
UPDATE storage.buckets
SET public = true,
    file_size_limit = 524288000, -- 500 MB
    allowed_mime_types = ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo']
WHERE id = 'videos';

-- If the bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  524288000,
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- Set CORS policy for the bucket
-- This allows the video to be accessed by MediaPipe from any origin
CREATE POLICY "Public video access for CORS"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos' AND auth.role() = 'anon');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');
