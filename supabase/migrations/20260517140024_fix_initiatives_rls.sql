-- Fix Initiatives RLS for NGO management

DROP POLICY IF EXISTS "NGOs can manage own initiatives" ON public.initiatives;
DROP POLICY IF EXISTS "NGO staff can manage their own NGO initiatives" ON public.initiatives;

CREATE POLICY "NGO management policy" ON public.initiatives
FOR ALL
USING (
    ngo_id IN (
        SELECT ngo_id FROM public.profiles WHERE id = auth.uid()
    )
);
