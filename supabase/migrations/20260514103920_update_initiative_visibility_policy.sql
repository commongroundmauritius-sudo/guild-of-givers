-- Ensure columns exist before policy creation to prevent CI failure
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Update the public visibility policy to include is_published (Guarded)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'initiatives') THEN
        DROP POLICY IF EXISTS "Anyone can view approved initiatives" ON public.initiatives;
        DROP POLICY IF EXISTS "Anyone can view published initiatives" ON public.initiatives;
        CREATE POLICY "Anyone can view published initiatives" ON public.initiatives
        FOR SELECT
        USING (is_approved = true AND is_published = true);
    END IF;
END $$;
