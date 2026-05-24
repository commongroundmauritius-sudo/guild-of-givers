-- Update the public visibility policy to include is_published
DROP POLICY IF EXISTS "Anyone can view approved initiatives" ON public.initiatives;
DROP POLICY IF EXISTS "Anyone can view initiatives" ON public.initiatives;

CREATE POLICY "Anyone can view published initiatives" ON public.initiatives
FOR SELECT
USING (is_approved = true AND is_published = true);
