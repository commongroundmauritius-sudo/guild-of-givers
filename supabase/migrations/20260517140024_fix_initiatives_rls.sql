-- Fix RLS for initiatives to ensure Organizations can manage their own initiatives correctly
BEGIN;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'initiatives') THEN
        DROP POLICY IF EXISTS "Organization staff can manage own initiatives" ON public.initiatives;

        CREATE POLICY "Organization staff can manage own initiatives" ON public.initiatives
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.organization_id = initiatives.organization_id
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.organization_id = initiatives.organization_id
            )
        );

    END IF;
END $$;
COMMIT;
