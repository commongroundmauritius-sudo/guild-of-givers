DROP POLICY IF EXISTS "Staff can manage own initiative links" ON public.campaign_links;
DROP POLICY IF EXISTS "Organization staff can manage own campaign links" ON public.campaign_links;
CREATE POLICY "Organization staff can manage campaign links" ON public.campaign_links FOR ALL TO authenticated USING (
  (select has_role('admin'::app_role)) OR
  EXISTS (SELECT 1 FROM initiatives i JOIN profiles p ON p.organization_id = i.organization_id WHERE i.id = campaign_links.initiative_id AND p.id = (select auth.uid()))
) WITH CHECK (
  (select has_role('admin'::app_role)) OR
  EXISTS (SELECT 1 FROM initiatives i JOIN profiles p ON p.organization_id = i.organization_id WHERE i.id = campaign_links.initiative_id AND p.id = (select auth.uid()))
);

DROP POLICY IF EXISTS "NGO staff can create initiative versions" ON public.initiative_versions;
DROP POLICY IF EXISTS "Staff can create initiative versions" ON public.initiative_versions;
DROP POLICY IF EXISTS "Organization staff can create initiative versions" ON public.initiative_versions;
CREATE POLICY "Organization staff can create initiative versions" ON public.initiative_versions FOR INSERT TO authenticated WITH CHECK (
  (select has_role('admin'::app_role)) OR
  EXISTS (SELECT 1 FROM initiatives i JOIN profiles p ON p.organization_id = i.organization_id WHERE i.id = initiative_versions.initiative_id AND p.id = (select auth.uid()))
);
DROP POLICY IF EXISTS "NGO staff can view own initiative versions" ON public.initiative_versions;
DROP POLICY IF EXISTS "Staff can view own initiative versions" ON public.initiative_versions;
DROP POLICY IF EXISTS "Organization staff can view initiative versions" ON public.initiative_versions;
CREATE POLICY "Organization staff can view initiative versions" ON public.initiative_versions FOR SELECT TO authenticated USING (
  (select has_role('admin'::app_role)) OR
  EXISTS (SELECT 1 FROM initiatives i JOIN profiles p ON p.organization_id = i.organization_id WHERE i.id = initiative_versions.initiative_id AND p.id = (select auth.uid()))
);
