DROP POLICY IF EXISTS "Initiative access policy" ON public.initiatives;

DROP POLICY IF EXISTS "Organization staff can manage their own reports" ON public.reports;
DROP POLICY IF EXISTS "Organization staff can manage their reports" ON public.reports;
DROP POLICY IF EXISTS "Organizations can manage their own reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can manage all reports" ON public.reports;

CREATE POLICY "Admins manage reports"
ON public.reports FOR ALL TO authenticated
USING (public.has_role('admin'::public.app_role) OR public.has_role('super_admin'::public.app_role))
WITH CHECK (public.has_role('admin'::public.app_role) OR public.has_role('super_admin'::public.app_role));

CREATE POLICY "Organization staff manage own reports"
ON public.reports FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.organization_id = reports.organization_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.organization_id = reports.organization_id
  )
);
