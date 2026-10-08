CREATE OR REPLACE FUNCTION public.has_role(requested_role app_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND (role = requested_role OR (requested_role = 'admin'::app_role AND role = 'super_admin'::app_role))
  );
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO service_role;
