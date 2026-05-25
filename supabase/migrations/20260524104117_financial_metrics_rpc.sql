-- Financial metrics RPC for Admin Dashboard

CREATE OR REPLACE FUNCTION public.get_admin_financial_metrics()
RETURNS JSONB AS $$
DECLARE
    v_total_collected NUMERIC;
    v_platform_fees NUMERIC;
    v_distributed_amount NUMERIC;
    v_pending_amount NUMERIC;
BEGIN
    SELECT COALESCE(SUM(amount_mur), 0) INTO v_total_collected FROM public.financial_events WHERE event_type = 'payment_received';
    SELECT COALESCE(SUM(amount_mur), 0) INTO v_platform_fees FROM public.financial_events WHERE event_type = 'platform_share';
    SELECT COALESCE(SUM(amount_mur), 0) INTO v_distributed_amount FROM public.financial_events WHERE event_type = 'allocation';

    -- Pending is Organization Pool balance
    SELECT cached_balance_mur INTO v_pending_amount FROM public.financial_accounts WHERE account_type = 'organization_pool' LIMIT 1;

    RETURN jsonb_build_object(
        'total_collected', v_total_collected,
        'platform_fees', v_platform_fees,
        'distributed_amount', v_distributed_amount,
        'pending_amount', v_pending_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'get_admin_financial_metrics' AND n.nspname = 'public') THEN
        REVOKE EXECUTE ON FUNCTION public.get_admin_financial_metrics() FROM PUBLIC, anon;
        GRANT EXECUTE ON FUNCTION public.get_admin_financial_metrics() TO authenticated;
    END IF;
END $$;
