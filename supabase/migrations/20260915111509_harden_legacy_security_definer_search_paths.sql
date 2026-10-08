ALTER FUNCTION public.update_initiative_counters() SET search_path = public;
ALTER FUNCTION public.trg_protect_org_verification() SET search_path = public;
ALTER FUNCTION public.assign_organization_owner(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.log_organization_changes() SET search_path = public;