REVOKE EXECUTE ON FUNCTION public.has_role(public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.protect_organization_security_fields() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_public_activity_insert() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_public_initiative_event_insert() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;
