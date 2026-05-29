-- Security Audit Pass 2: Hardening PostgreSQL Functions and RLS

-- 1. Enforce search_path = public on all SECURITY DEFINER functions to prevent hijacking
DO $$
BEGIN
    -- increment_initiative_amount
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'increment_initiative_amount' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.increment_initiative_amount(uuid, numeric) SET search_path = public;
    END IF;

    -- get_admin_financial_metrics
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'get_admin_financial_metrics' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.get_admin_financial_metrics() SET search_path = public;
    END IF;

    -- check_financial_event_immutability
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'check_financial_event_immutability' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.check_financial_event_immutability() SET search_path = public;
    END IF;

    -- handle_updated_at
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'handle_updated_at' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.handle_updated_at() SET search_path = public;
    END IF;

    -- track_lead_status_change
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'track_lead_status_change' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.track_lead_status_change() SET search_path = public;
    END IF;

    -- update_last_engagement
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'update_last_engagement' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.update_last_engagement() SET search_path = public;
    END IF;

    -- get_trending_initiatives
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'get_trending_initiatives' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.get_trending_initiatives(integer) SET search_path = public;
    END IF;

    -- allocate_payment_funds
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'allocate_payment_funds' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.allocate_payment_funds(uuid, uuid, numeric) SET search_path = public;
    END IF;

    -- process_recurring_billing
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'process_recurring_billing' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.process_recurring_billing() SET search_path = public;
    END IF;

    -- get_ledger_summary_metrics
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'get_ledger_summary_metrics' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.get_ledger_summary_metrics() SET search_path = public;
    END IF;

    -- calculate_initiative_health
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'calculate_initiative_health' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.calculate_initiative_health(uuid) SET search_path = public;
    END IF;

    -- aggregate_daily_stats
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'aggregate_daily_stats' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.aggregate_daily_stats(date) SET search_path = public;
    END IF;

    -- reconcile_initiative_analytics
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'reconcile_initiative_analytics' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.reconcile_initiative_analytics(uuid) SET search_path = public;
    END IF;

    -- has_role
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'has_role' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.has_role(public.app_role) SET search_path = public;
    END IF;
END $$;

-- 2. Revoke execution rights from sensitive functions for public/anon/authenticated
DO $$
BEGIN
    -- Billing and Funds should only be called by service_role or system triggers
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'process_recurring_billing' AND n.nspname = 'public') THEN
        REVOKE EXECUTE ON FUNCTION public.process_recurring_billing() FROM PUBLIC, anon, authenticated;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'allocate_payment_funds' AND n.nspname = 'public') THEN
        REVOKE EXECUTE ON FUNCTION public.allocate_payment_funds(uuid, uuid, numeric) FROM PUBLIC, anon, authenticated;
    END IF;

    -- Admin metrics should only be accessible to admins (internal check exists but revoking at DB level is safer)
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'get_admin_financial_metrics' AND n.nspname = 'public') THEN
        REVOKE EXECUTE ON FUNCTION public.get_admin_financial_metrics() FROM PUBLIC, anon, authenticated;
        -- We'll rely on service_role for the dashboard or grant specifically if needed.
        -- If the frontend calls this via RPC as an admin, we might need to GRANT to authenticated but keep the internal role check.
        -- Let's GRANT to authenticated but the function itself should still check the role.
        GRANT EXECUTE ON FUNCTION public.get_admin_financial_metrics() TO authenticated;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'get_ledger_summary_metrics' AND n.nspname = 'public') THEN
        REVOKE EXECUTE ON FUNCTION public.get_ledger_summary_metrics() FROM PUBLIC, anon, authenticated;
        GRANT EXECUTE ON FUNCTION public.get_ledger_summary_metrics() TO authenticated;
    END IF;

    -- has_role should not be executable by anon
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'has_role' AND n.nspname = 'public') THEN
        REVOKE EXECUTE ON FUNCTION public.has_role(public.app_role) FROM PUBLIC, anon;
        GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;
    END IF;

    -- aggregate_daily_stats
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'aggregate_daily_stats' AND n.nspname = 'public') THEN
        REVOKE EXECUTE ON FUNCTION public.aggregate_daily_stats(date) FROM PUBLIC, anon, authenticated;
    END IF;
END $$;

-- 3. Tighten RLS for highly permissive policies where possible
-- initiative_events: only allow member_view, page_view etc via public insert
-- This is hard to do with standard RLS without a check on event_type.
-- For now, we'll keep it as is but recommend a wrapper function.
