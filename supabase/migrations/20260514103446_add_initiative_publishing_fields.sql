-- Add fields for publishing and detailed content to initiatives
ALTER TABLE initiatives
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS caption TEXT;
