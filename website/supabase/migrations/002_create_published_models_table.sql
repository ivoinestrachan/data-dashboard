-- Create published_models table
CREATE TABLE IF NOT EXISTS published_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  industry TEXT NOT NULL,
  specialty TEXT NOT NULL,
  level INTEGER NOT NULL,
  cost INTEGER NOT NULL DEFAULT 0,
  avatar TEXT,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  thumbnail_url TEXT,
  specs JSONB NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on created_at for faster queries
CREATE INDEX IF NOT EXISTS published_models_created_at_idx ON published_models(created_at DESC);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS published_models_user_id_idx ON published_models(user_id);

-- Create index on video_id
CREATE INDEX IF NOT EXISTS published_models_video_id_idx ON published_models(video_id);

-- Enable Row Level Security
ALTER TABLE published_models ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all read operations
CREATE POLICY "Allow all read operations on published_models" ON published_models
  FOR SELECT
  USING (true);

-- Create policy to allow authenticated users to insert their own models
CREATE POLICY "Allow authenticated inserts on published_models" ON published_models
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow users to update their own models
CREATE POLICY "Allow users to update own published_models" ON published_models
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Create policy to allow users to delete their own models
CREATE POLICY "Allow users to delete own published_models" ON published_models
  FOR DELETE
  USING (auth.uid()::text = user_id);
