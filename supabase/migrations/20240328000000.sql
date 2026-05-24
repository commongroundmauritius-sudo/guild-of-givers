-- Link users to Organizations and improve data relationships

-- Add organization_id to profiles to support Organization staff/owners
-- Using DO block to handle conditional logic based on table names
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

        DROP POLICY IF EXISTS "Organization staff can manage their own Organization initiatives" ON public.initiatives;
        CREATE POLICY "Organization staff can manage their own Organization initiatives"
          ON public.initiatives FOR ALL
          USING (
            organization_id IN (
              SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
            )
          );

        DROP POLICY IF EXISTS "Organization staff can manage their own Organization reports" ON public.reports;
        CREATE POLICY "Organization staff can manage their own Organization reports"
          ON public.reports FOR ALL
          USING (
            organization_id IN (
              SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
            )
          );
    ELSE
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ngo_id UUID REFERENCES public.ngos(id) ON DELETE SET NULL;

        DROP POLICY IF EXISTS "NGO staff can manage their own NGO initiatives" ON public.initiatives;
        CREATE POLICY "NGO staff can manage their own NGO initiatives"
          ON public.initiatives FOR ALL
          USING (
            ngo_id IN (
              SELECT ngo_id FROM public.profiles WHERE id = (SELECT auth.uid())
            )
          );
    END IF;
END $$;
