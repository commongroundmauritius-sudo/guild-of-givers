-- Add gallery and refine fields
ALTER TABLE initiatives
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS summary TEXT; -- For the 'bio' or short intro

-- Ensure RLS allows admins to manage these
GRANT ALL ON initiatives TO authenticated;
