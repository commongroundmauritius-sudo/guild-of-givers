-- Remove permissive policies that currently expose private analytics, reports, queues, and mutable financial operations.
DROP POLICY IF EXISTS "Stabilization SELECT access for authenticated" ON public.daily_initiative_stats;
DROP POLICY IF EXISTS "Stabilization SELECT access for authenticated" ON public.daily_revenue_stats;
DROP POLICY IF EXISTS "Anyone can view reports" ON public.reports;
DROP POLICY IF EXISTS "Anyone can view reports for active initiatives" ON public.reports;
DROP POLICY IF EXISTS "Anyone can insert into email_queue" ON public.email_queue;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can manage financial events" ON public.financial_events;
DROP POLICY IF EXISTS "Admins can manage all initiatives" ON public.initiatives;
DROP POLICY IF EXISTS "Admins can read all initiatives" ON public.initiatives;
DROP POLICY IF EXISTS "Initiative management policy" ON public.initiatives;
DROP POLICY IF EXISTS "Organization staff can manage own initiatives" ON public.initiatives;
DROP POLICY IF EXISTS "Organization staff management policy" ON public.initiatives;
DROP POLICY IF EXISTS "Organizations can manage own initiatives" ON public.initiatives;

-- Reports are member/admin/organization-only; they are not public content.
CREATE POLICY "Active members can view reports"
ON public.reports FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = (SELECT auth.uid())
      AND s.status = 'active'::public.subscription_status
  )
  OR public.has_role('admin'::public.app_role)
  OR public.has_role('super_admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.organization_id = reports.organization_id
  )
);

-- Admins/super-admins retain full initiative management; organization staff can manage only their own initiatives.
CREATE POLICY "Admins manage initiatives"
ON public.initiatives FOR ALL TO authenticated
USING (public.has_role('admin'::public.app_role) OR public.has_role('super_admin'::public.app_role))
WITH CHECK (public.has_role('admin'::public.app_role) OR public.has_role('super_admin'::public.app_role));

CREATE POLICY "Organization staff manage own initiatives"
ON public.initiatives FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.organization_id = initiatives.organization_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.organization_id = initiatives.organization_id
  )
);

CREATE POLICY "Public can view published initiatives"
ON public.initiatives FOR SELECT TO anon, authenticated
USING (
  (is_approved = true AND is_published = true)
  OR public.has_role('admin'::public.app_role)
  OR public.has_role('super_admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.organization_id = initiatives.organization_id
  )
);

-- Financial events are immutable. Clients may read their permitted rows, but never mutate the ledger directly.
CREATE POLICY "Admins can view all financial events"
ON public.financial_events FOR SELECT TO authenticated
USING (public.has_role('admin'::public.app_role) OR public.has_role('super_admin'::public.app_role));

-- Daily revenue is admin-only; initiative stats remain organization/admin scoped.
DROP POLICY IF EXISTS "Admins can view revenue stats" ON public.daily_revenue_stats;
CREATE POLICY "Admins can view revenue stats"
ON public.daily_revenue_stats FOR SELECT TO authenticated
USING (public.has_role('admin'::public.app_role) OR public.has_role('super_admin'::public.app_role));

-- Remove direct client creation of subscriptions; subscription state must be established by the payment workflow.
-- Existing own-row SELECT policy remains.

-- Harden financial/analytics tables against direct client mutation.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.financial_events FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.daily_revenue_stats FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.daily_initiative_stats FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.daily_campaign_stats FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.email_queue FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.payments FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.subscriptions FROM anon, authenticated;

-- Protect profile security/ownership fields with a trigger; users may still edit ordinary profile fields through the existing RLS policy.
CREATE OR REPLACE FUNCTION public.protect_profile_security_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT public.has_role('admin'::public.app_role) AND NOT public.has_role('super_admin'::public.app_role) THEN
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.source_initiative_id IS DISTINCT FROM OLD.source_initiative_id
       OR NEW.primary_initiative_id IS DISTINCT FROM OLD.primary_initiative_id
       OR NEW.lifecycle_stage IS DISTINCT FROM OLD.lifecycle_stage THEN
      RAISE EXCEPTION 'Unauthorized: protected profile fields cannot be changed by the profile owner';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_profile_security_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_security_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_security_fields();

-- Super-admins must be treated consistently with admins by status/verification triggers.
CREATE OR REPLACE FUNCTION public.check_initiative_status_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT (public.has_role('admin'::public.app_role) OR public.has_role('super_admin'::public.app_role)) THEN
    IF NEW.is_approved IS DISTINCT FROM OLD.is_approved
       OR NEW.is_published IS DISTINCT FROM OLD.is_published THEN
      RAISE EXCEPTION 'Unauthorized: Only admins can modify initiative status or visibility';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_report_status_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT (public.has_role('admin'::public.app_role) OR public.has_role('super_admin'::public.app_role)) THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Unauthorized: Only admins can modify report status';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Remove public RPC execution from SECURITY DEFINER functions. Only explicitly safe client RPCs remain exposed.
DO $block$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS fn
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM public', r.fn);
  END LOOP;
END;
$block$;

-- Safe read/utility RPCs used by the public application.
GRANT EXECUTE ON FUNCTION public.get_trending_initiatives(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_partner_application(text,text,text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_organization(uuid) TO authenticated;

-- Server-side/system RPCs are callable by service_role only.
GRANT EXECUTE ON FUNCTION public.activate_membership(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.aggregate_daily_stats(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.allocate_payment_funds(uuid,uuid,numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.assign_organization_owner(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.calculate_initiative_health(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.calculate_supporter_engagement_scores() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_financial_metrics() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_ledger_summary_metrics() TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_initiative_amount(uuid,numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_abandoned_leads(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_recurring_billing() TO service_role;
GRANT EXECUTE ON FUNCTION public.reconcile_initiative_analytics(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.snapshot_initiative_health() TO service_role;

-- Trigger/internal functions need no public API execution grant, but their search_path is pinned.
ALTER FUNCTION public.increment_initiative_amount(uuid,numeric) SET search_path = public;
ALTER FUNCTION public.get_admin_financial_metrics() SET search_path = public;
ALTER FUNCTION public.check_financial_event_immutability() SET search_path = public;
ALTER FUNCTION public.track_lead_status_change() SET search_path = public;
ALTER FUNCTION public.update_last_engagement() SET search_path = public;
ALTER FUNCTION public.get_trending_initiatives(integer) SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.trg_protect_org_verification() SET search_path = public;
ALTER FUNCTION public.log_organization_changes() SET search_path = public;
ALTER FUNCTION public.protect_profile_security_fields() SET search_path = public;

