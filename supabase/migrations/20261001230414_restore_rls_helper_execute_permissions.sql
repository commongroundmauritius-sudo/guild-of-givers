
-- These SECURITY DEFINER helpers are intentionally used inside RLS policies.
-- They do not grant table access; RLS predicates still enforce authorization.
grant execute on function public.has_role(public.app_role) to authenticated;
grant execute on function public.get_auth_org_id() to authenticated;
grant execute on function public.get_crm_tag_org_id(uuid) to authenticated;
