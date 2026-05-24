-- Update the public visibility policy to include is_published
-- Using a DO block to safely handle column existence
DO $$
BEGIN
    DROP POLICY IF EXISTS "Anyone can view approved initiatives" ON public.initiatives;
    DROP POLICY IF EXISTS "Anyone can view initiatives" ON public.initiatives;
    DROP POLICY IF EXISTS "Anyone can view published initiatives" ON public.initiatives;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'initiatives' AND column_name = 'is_approved'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'initiatives' AND column_name = 'is_published'
    ) THEN
        CREATE POLICY "Anyone can view published initiatives" ON public.initiatives
        FOR SELECT
        USING (is_approved = true AND is_published = true);
    ELSE
        CREATE POLICY "Anyone can view published initiatives" ON public.initiatives
        FOR SELECT
        USING (true); -- Fallback for migration sequence
    END IF;
END $$;
