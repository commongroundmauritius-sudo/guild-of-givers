BEGIN;

-- 1. Ensure event types are complete
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE typname = 'financial_event_type' AND enumlabel = 'net_payment') THEN
        ALTER TYPE public.financial_event_type ADD VALUE 'net_payment';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE typname = 'financial_event_type' AND enumlabel = 'payment_received') THEN
        ALTER TYPE public.financial_event_type ADD VALUE 'payment_received';
    END IF;
END $$;

-- 2. Hardened Allocation Logic (ROUNDING & ATOMICITY)
CREATE OR REPLACE FUNCTION public.allocate_payment_funds(
    p_payment_id uuid,
    p_user_id uuid,
    p_total_amount numeric
)
RETURNS void AS $$
DECLARE
    v_fee_config RECORD;
    v_fee_amount NUMERIC := 0;
    v_net_amount NUMERIC;
    v_cg_share NUMERIC;
    v_org_pool_amount NUMERIC;
    
    v_cg_account_id UUID;
    v_org_pool_account_id UUID;
    v_impact_pool_account_id UUID;
    v_fee_account_id UUID;
    v_impact_pool_initiative_id UUID;
    
    v_billing_cycle_id UUID;
    v_current_month INTEGER;
    v_current_year INTEGER;
    
    v_pref RECORD;
    v_remaining_pool NUMERIC;
    v_to_allocate NUMERIC;
    v_funding_cycle_id UUID;
    v_cycle_target NUMERIC;
    v_cycle_received NUMERIC;
    v_cycle_space NUMERIC;
    
    v_prev_bal NUMERIC;
BEGIN
    -- Idempotency check: Don't process if payment already has allocations
    IF EXISTS (SELECT 1 FROM public.financial_events WHERE payment_id = p_payment_id AND event_type IN ('platform_share', 'allocation')) THEN
        RETURN;
    END IF;

    -- 1. Setup & Context
    SELECT * INTO v_fee_config FROM public.fee_configurations WHERE active = true LIMIT 1;
    
    SELECT id INTO v_cg_account_id FROM public.financial_accounts WHERE account_type = 'platform' AND is_system = true LIMIT 1;
    SELECT id INTO v_org_pool_account_id FROM public.financial_accounts WHERE account_type = 'organization_pool' AND is_system = true LIMIT 1;
    SELECT id INTO v_fee_account_id FROM public.financial_accounts WHERE account_type = 'fee' AND is_system = true LIMIT 1;

    SELECT id INTO v_impact_pool_initiative_id FROM public.initiatives WHERE is_impact_pool = true AND is_system_owned = true LIMIT 1;
    SELECT id INTO v_impact_pool_account_id FROM public.financial_accounts WHERE reference_id = v_impact_pool_initiative_id LIMIT 1;

    v_current_month := EXTRACT(MONTH FROM now());
    v_current_year := EXTRACT(YEAR FROM now());

    SELECT id INTO v_billing_cycle_id FROM public.billing_cycles WHERE month = v_current_month AND year = v_current_year;
    IF v_billing_cycle_id IS NULL THEN
        INSERT INTO public.billing_cycles (month, year, start_date, end_date)
        VALUES (v_current_month, v_current_year, date_trunc('month', now())::date, (date_trunc('month', now()) + interval '1 month - 1 day')::date)
        RETURNING id INTO v_billing_cycle_id;
    END IF;

    -- 2. Calculate Fees (Hybrid Support)
    IF v_fee_config.fee_type = 'percentage' THEN
        v_fee_amount := ROUND(p_total_amount * (v_fee_config.percentage_value / 100.0), 2);
    ELSIF v_fee_config.fee_type = 'fixed' THEN
        v_fee_amount := v_fee_config.fixed_amount_mur;
    ELSIF v_fee_config.fee_type = 'hybrid' THEN
        v_fee_amount := ROUND(p_total_amount * (v_fee_config.percentage_value / 100.0), 2) + v_fee_config.fixed_amount_mur;
    END IF;

    v_net_amount := p_total_amount - v_fee_amount;

    -- 3. Allocation Split (20/80 with Rounding Drift Protection)
    v_cg_share := ROUND(v_net_amount * 0.20, 2);
    v_org_pool_amount := v_net_amount - v_cg_share;

    -- 4. Execute Atomic Ledger Entries
    
    -- A. Transaction Fee
    SELECT cached_balance_mur INTO v_prev_bal FROM public.financial_accounts WHERE id = v_fee_account_id FOR UPDATE;
    INSERT INTO public.financial_events (payment_id, billing_cycle_id, user_id, account_id, event_type, amount_mur, previous_balance, resulting_balance)
    VALUES (p_payment_id, v_billing_cycle_id, p_user_id, v_fee_account_id, 'transaction_fee', v_fee_amount, v_prev_bal, v_prev_bal + v_fee_amount);
    UPDATE public.financial_accounts SET cached_balance_mur = v_prev_bal + v_fee_amount WHERE id = v_fee_account_id;

    -- B. Platform Share
    SELECT cached_balance_mur INTO v_prev_bal FROM public.financial_accounts WHERE id = v_cg_account_id FOR UPDATE;
    INSERT INTO public.financial_events (payment_id, billing_cycle_id, user_id, account_id, event_type, amount_mur, previous_balance, resulting_balance)
    VALUES (p_payment_id, v_billing_cycle_id, p_user_id, v_cg_account_id, 'platform_share', v_cg_share, v_prev_bal, v_prev_bal + v_cg_share);
    UPDATE public.financial_accounts SET cached_balance_mur = v_prev_bal + v_cg_share WHERE id = v_cg_account_id;

    -- C. Organization Pool (Distribution)
    v_remaining_pool := v_org_pool_amount;
    
    FOR v_pref IN (
        SELECT mp.initiative_id, i.monthly_target_mur, fa.id as account_id
        FROM public.member_preferences mp
        JOIN public.initiatives i ON i.id = mp.initiative_id
        JOIN public.financial_accounts fa ON fa.reference_id = i.id
        WHERE mp.user_id = p_user_id
        ORDER BY mp.priority_level ASC
    ) LOOP
        EXIT WHEN v_remaining_pool <= 0;

        SELECT id, target_amount_mur, received_amount_mur INTO v_funding_cycle_id, v_cycle_target, v_cycle_received 
        FROM public.initiative_funding_cycles 
        WHERE initiative_id = v_pref.initiative_id AND billing_cycle_id = v_billing_cycle_id
        FOR UPDATE;

        IF v_funding_cycle_id IS NULL THEN
            v_cycle_target := v_pref.monthly_target_mur;
            INSERT INTO public.initiative_funding_cycles (initiative_id, billing_cycle_id, month, year, target_amount_mur, received_amount_mur, remaining_amount_mur)
            VALUES (v_pref.initiative_id, v_billing_cycle_id, v_current_month, v_current_year, v_cycle_target, 0, v_cycle_target)
            RETURNING id INTO v_funding_cycle_id;
            v_cycle_received := 0;
        END IF;

        v_cycle_space := GREATEST(0, v_cycle_target - v_cycle_received);
        
        IF v_cycle_space > 0 OR v_pref.monthly_target_mur = 0 THEN
            v_to_allocate := LEAST(v_remaining_pool, CASE WHEN v_cycle_target > 0 THEN v_cycle_space ELSE v_remaining_pool END);
            
            IF v_to_allocate > 0 THEN
                SELECT cached_balance_mur INTO v_prev_bal FROM public.financial_accounts WHERE id = v_pref.account_id FOR UPDATE;
                INSERT INTO public.financial_events (payment_id, billing_cycle_id, user_id, initiative_id, account_id, event_type, amount_mur, previous_balance, resulting_balance)
                VALUES (p_payment_id, v_billing_cycle_id, p_user_id, v_pref.initiative_id, v_pref.account_id, 'allocation', v_to_allocate, v_prev_bal, v_prev_bal + v_to_allocate);
                UPDATE public.financial_accounts SET cached_balance_mur = v_prev_bal + v_to_allocate WHERE id = v_pref.account_id;

                UPDATE public.initiative_funding_cycles 
                SET received_amount_mur = received_amount_mur + v_to_allocate,
                    remaining_amount_mur = GREATEST(0, target_amount_mur - (received_amount_mur + v_to_allocate)),
                    status = CASE WHEN (received_amount_mur + v_to_allocate) >= target_amount_mur AND target_amount_mur > 0 THEN 'completed'::public.funding_cycle_status ELSE 'active'::public.funding_cycle_status END
                WHERE id = v_funding_cycle_id;

                UPDATE public.initiatives SET current_amount_mur = current_amount_mur + v_to_allocate WHERE id = v_pref.initiative_id;
                v_remaining_pool := v_remaining_pool - v_to_allocate;
            END IF;
        END IF;
    END LOOP;

    -- 5. Impact Pool Fallback
    IF v_remaining_pool > 0 THEN
        SELECT cached_balance_mur INTO v_prev_bal FROM public.financial_accounts WHERE id = v_impact_pool_account_id FOR UPDATE;
        INSERT INTO public.financial_events (payment_id, billing_cycle_id, user_id, initiative_id, account_id, event_type, amount_mur, previous_balance, resulting_balance)
        VALUES (p_payment_id, v_billing_cycle_id, p_user_id, v_impact_pool_initiative_id, v_impact_pool_account_id, 'impact_pool', v_remaining_pool, v_prev_bal, v_prev_bal + v_remaining_pool);
        UPDATE public.financial_accounts SET cached_balance_mur = v_prev_bal + v_remaining_pool WHERE id = v_impact_pool_account_id;

        INSERT INTO public.initiative_funding_cycles (initiative_id, billing_cycle_id, month, year, target_amount_mur, received_amount_mur, status)
        VALUES (v_impact_pool_initiative_id, v_billing_cycle_id, v_current_month, v_current_year, 0, v_remaining_pool, 'active')
        ON CONFLICT (initiative_id, billing_cycle_id) DO UPDATE SET received_amount_mur = initiative_funding_cycles.received_amount_mur + EXCLUDED.received_amount_mur;

        UPDATE public.initiatives SET current_amount_mur = current_amount_mur + v_remaining_pool WHERE id = v_impact_pool_initiative_id;
        v_remaining_pool := 0;
    END IF;

    -- 6. Update Analytics
    UPDATE public.initiative_funding_cycles
    SET supporter_count = supporter_count + 1
    WHERE billing_cycle_id = v_billing_cycle_id
    AND initiative_id IN (SELECT initiative_id FROM public.financial_events WHERE payment_id = p_payment_id AND event_type IN ('allocation', 'impact_pool'));

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Improved Summary Metrics
CREATE OR REPLACE FUNCTION public.get_ledger_summary_metrics()
RETURNS jsonb AS $$
DECLARE
    v_gross_total NUMERIC;
    v_total_fees NUMERIC;
    v_platform_share NUMERIC;
    v_allocated NUMERIC;
    v_impact_pool NUMERIC;
    v_recurring_forecast NUMERIC;
    v_net_contributions NUMERIC;
BEGIN
    SELECT COALESCE(SUM(amount_mur), 0) INTO v_gross_total FROM public.payments WHERE status = 'success';
    SELECT COALESCE(SUM(amount_mur), 0) INTO v_total_fees FROM public.financial_events WHERE event_type = 'transaction_fee';
    
    v_net_contributions := v_gross_total - v_total_fees;
    
    SELECT COALESCE(SUM(amount_mur), 0) INTO v_platform_share FROM public.financial_events WHERE event_type = 'platform_share';
    SELECT COALESCE(SUM(amount_mur), 0) INTO v_allocated FROM public.financial_events WHERE event_type = 'allocation';
    SELECT COALESCE(SUM(amount_mur), 0) INTO v_impact_pool FROM public.financial_events WHERE event_type = 'impact_pool';
    
    SELECT COALESCE(SUM(amount_mur), 0) INTO v_recurring_forecast FROM public.subscriptions WHERE status = 'active';

    RETURN jsonb_build_object(
        'gross_contributions', v_gross_total,
        'total_fees', v_total_fees,
        'net_contributions', v_net_contributions,
        'platform_share', v_platform_share,
        'organization_pool', v_allocated,
        'impact_pool', v_impact_pool,
        'recurring_forecast', v_recurring_forecast
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
