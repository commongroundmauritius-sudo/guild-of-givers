-- Apply to the EXISTING database through its migration runner/SQL editor.
-- This is a repair script, not an applied migration.
BEGIN;
CREATE OR REPLACE FUNCTION public.has_role(requested_role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()
    AND (role = requested_role OR (requested_role = 'admin'::public.app_role
      AND role = 'super_admin'::public.app_role)));
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT ON public.admin_actions TO authenticated;
GRANT ALL ON public.user_roles, public.admin_actions TO service_role;
DO $$
BEGIN
  ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
  DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Super Admins can manage all roles" ON public.user_roles;
  CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
  CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT TO authenticated USING (public.has_role('admin'::public.app_role));
  CREATE POLICY "Super Admins can manage all roles" ON public.user_roles
    FOR ALL TO authenticated USING (public.has_role('super_admin'::public.app_role))
    WITH CHECK (public.has_role('super_admin'::public.app_role));
  ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Admins can view all actions" ON public.admin_actions;
  DROP POLICY IF EXISTS "Admins can insert actions" ON public.admin_actions;
  CREATE POLICY "Admins can view all actions" ON public.admin_actions
    FOR SELECT TO authenticated USING (public.has_role('admin'::public.app_role));
  CREATE POLICY "Admins can insert actions" ON public.admin_actions
    FOR INSERT TO authenticated
    WITH CHECK (admin_id = (SELECT auth.uid()) AND public.has_role('admin'::public.app_role));
END $$;
COMMIT;