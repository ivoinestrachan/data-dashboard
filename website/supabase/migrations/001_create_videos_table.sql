-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_url TEXT,
  video_url TEXT NOT NULL,
  duration INTEGER,
  size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on uploaded_at for faster queries
CREATE INDEX IF NOT EXISTS videos_uploaded_at_idx ON videos(uploaded_at DESC);

-- Create index on recorded_at
CREATE INDEX IF NOT EXISTS videos_recorded_at_idx ON videos(recorded_at DESC);

-- Enable Row Level Security
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on videos" ON videos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for videos bucket
CREATE POLICY "Allow public read access on videos bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Allow authenticated uploads to videos bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Allow authenticated deletes on videos bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos');
