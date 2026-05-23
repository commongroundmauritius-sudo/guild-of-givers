-- Ensure Admins can see all allocations
DROP POLICY IF EXISTS "Admins can view all allocations" ON public.allocations;
CREATE POLICY "Admins can view all allocations" ON public.allocations
FOR SELECT USING (public.has_role('admin'));

-- Ensure Admins can see all member preferences (for priority distribution)
DROP POLICY IF EXISTS "Admins can view all member preferences" ON public.member_preferences;
CREATE POLICY "Admins can view all member preferences" ON public.member_preferences
FOR SELECT USING (public.has_role('admin'));
