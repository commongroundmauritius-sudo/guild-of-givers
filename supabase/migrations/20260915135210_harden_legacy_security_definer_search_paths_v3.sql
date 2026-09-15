-- Harden legacy SECURITY DEFINER functions that remain in the live database.
-- secure_convert_lead is intentionally retired from the live schema and is kept
-- only in historical migrations; the audit tracks that retirement explicitly.
-- SECURITY_AUDIT_RETIRED_FUNCTION: secure_convert_lead

ALTER FUNCTION public.update_initiative_counters() SET search_path = public;
ALTER FUNCTION public.trg_protect_org_verification() SET search_path = public;
ALTER FUNCTION public.assign_organization_owner(target_org_id uuid, target_user_id uuid) SET search_path = public;
ALTER FUNCTION public.log_organization_changes() SET search_path = public;
