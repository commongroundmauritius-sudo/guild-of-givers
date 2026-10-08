DROP POLICY IF EXISTS "Admins can view all member preferences" ON public.member_preferences;
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.member_preferences;
CREATE POLICY "Users and admins can view member preferences" ON public.member_preferences FOR SELECT TO anon, authenticated USING (((select auth.uid()) = user_id) OR (select has_role('admin'::app_role)) OR (select has_role('super_admin'::app_role)));
CREATE POLICY "Users can manage own preferences" ON public.member_preferences FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all activities" ON public.activities;
DROP POLICY IF EXISTS "Users can view own activities" ON public.activities;
DROP POLICY IF EXISTS "Staff can view own organization activities" ON public.activities;
CREATE POLICY "Authorized users can view activities" ON public.activities FOR SELECT TO authenticated USING (
  (select has_role('admin'::app_role)) OR
  (select has_role('super_admin'::app_role)) OR
  (user_id = (select auth.uid())) OR
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.organization_id = activities.organization_id) OR
  EXISTS (SELECT 1 FROM initiatives i JOIN profiles p ON p.organization_id = i.organization_id WHERE i.id = activities.initiative_id AND p.id = (select auth.uid()))
);
