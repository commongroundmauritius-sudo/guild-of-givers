-- Link users to Organizations and improve data relationships

-- Add organization_id to profiles to support Organization staff/owners
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Update RLS for Organization dashboard access (Guarded)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'initiatives') THEN
        DROP POLICY IF EXISTS "Organization staff can manage their own Organization initiatives" ON public.initiatives;
        CREATE POLICY "Organization staff can manage their own Organization initiatives"
          ON public.initiatives FOR ALL
          USING (
            organization_id IN (
              SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
            )
          );
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
        DROP POLICY IF EXISTS "Organization staff can manage their own Organization reports" ON public.reports;
        CREATE POLICY "Organization staff can manage their own Organization reports"
          ON public.reports FOR ALL
          USING (
            organization_id IN (
              SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
            )
          );
    END IF;
END $$;
