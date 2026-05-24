-- Fix RLS for initiatives to ensure Organizations can manage their own initiatives correctly
BEGIN;

DROP POLICY IF EXISTS "NGO staff can manage own initiatives" ON public.initiatives;
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

COMMIT;
