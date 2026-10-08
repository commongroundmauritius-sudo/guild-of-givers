REVOKE EXECUTE ON FUNCTION public.get_trending_initiatives(integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_partner_application(text,text,text,text,text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_edit_organization(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_auth_org_id() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_initiative_org_id(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(public.app_role) FROM authenticated;

-- These helper/RBAC functions are no longer directly exposed through PostgREST.
-- They remain callable by trusted server-side execution where needed.
GRANT EXECUTE ON FUNCTION public.get_trending_initiatives(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_partner_application(text,text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_edit_organization(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_auth_org_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_initiative_org_id(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO service_role;
