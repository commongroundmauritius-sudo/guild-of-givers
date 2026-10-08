GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_organization(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_initiative_org_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trending_initiatives(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_partner_application(text,text,text,text,text) TO anon, authenticated;
