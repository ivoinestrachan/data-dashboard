-- Add category column to published_models table
ALTER TABLE published_models ADD COLUMN IF NOT EXISTS category TEXT;

-- Create index on category for faster queries
CREATE INDEX IF NOT EXISTS published_models_category_idx ON published_models(category);
