-- Update the public visibility policy to include is_published
DROP POLICY IF EXISTS "Anyone can view approved initiatives" ON initiatives;

CREATE POLICY "Anyone can view published initiatives" ON initiatives
FOR SELECT
USING (is_approved = true AND is_published = true);
