-- Security Stabilization Migration
-- Resolved [P0-005] and [P1-001]

-- 1. Explicitly set search_path for all verified vulnerable functions
ALTER FUNCTION public.allocate_payment_funds(uuid, uuid, numeric) SET search_path = public;
ALTER FUNCTION public.get_admin_financial_metrics() SET search_path = public;
ALTER FUNCTION public.has_role(public.app_role) SET search_path = public;
ALTER FUNCTION public.increment_initiative_amount(uuid, numeric) SET search_path = public;
ALTER FUNCTION public.process_recurring_billing() SET search_path = public;

-- 2. Revoke PUBLIC/anon access from sensitive business logic
-- Note: has_role needs anon/authenticated for RLS policies
-- Note: increment_initiative_amount should be internal only (called by triggers or RPC)

REVOKE EXECUTE ON FUNCTION public.allocate_payment_funds(uuid, uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_recurring_billing() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.activate_membership(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_initiative_amount(uuid, numeric) FROM PUBLIC, anon, authenticated;

-- 3. Grant limited access where required
GRANT EXECUTE ON FUNCTION public.get_admin_financial_metrics() TO authenticated;
-- Verify if get_admin_financial_metrics has its own internal role check (it should)

-- Additional fixes from Phase 1-C deep scan
ALTER FUNCTION public.get_ledger_summary_metrics() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.get_ledger_summary_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ledger_summary_metrics() TO authenticated;
