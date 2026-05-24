-- Fix Initiatives RLS for Organization management
-- This ensures Organizations can manage their own initiatives after the rename or while still NGOs

DO $$
BEGIN
    DROP POLICY IF EXISTS "NGOs can manage own initiatives" ON public.initiatives;
    DROP POLICY IF EXISTS "Organization staff can manage their own Organization initiatives" ON public.initiatives;
    DROP POLICY IF EXISTS "Organization management policy" ON public.initiatives;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'organization_id') THEN
        CREATE POLICY "Organization management policy" ON public.initiatives
        FOR ALL
        USING (
            organization_id IN (
                SELECT organization_id FROM public.profiles WHERE id = auth.uid()
            )
        );
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'ngo_id') THEN
        CREATE POLICY "Organization management policy" ON public.initiatives
        FOR ALL
        USING (
            ngo_id IN (
                SELECT ngo_id FROM public.profiles WHERE id = auth.uid()
                OR organization_id FROM public.profiles WHERE id = auth.uid()
            )
        );
    END IF;
END $$;
