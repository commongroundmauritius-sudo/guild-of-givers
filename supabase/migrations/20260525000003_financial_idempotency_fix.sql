-- Financial Idempotency Fix
-- Resolved [P1-006]

CREATE OR REPLACE FUNCTION public.allocate_payment_funds(
    p_payment_id UUID,
    p_user_id UUID,
    p_total_amount NUMERIC
)
RETURNS VOID AS $$
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
    v_initiative_account_id UUID;
    v_funding_cycle_id UUID;
    v_cycle_target NUMERIC;
    v_cycle_received NUMERIC;
    v_cycle_space NUMERIC;

    v_prev_bal NUMERIC;
    v_new_bal NUMERIC;
BEGIN
    -- 0. Idempotency Check (P1-006)
    IF EXISTS (SELECT 1 FROM public.financial_events WHERE payment_id = p_payment_id) THEN
        RAISE NOTICE 'Payment % already allocated. Skipping.', p_payment_id;
        RETURN;
    END IF;

    -- 1. Setup & Validation
    SELECT * INTO v_fee_config FROM public.fee_configurations WHERE active = true LIMIT 1;

    SELECT id INTO v_cg_account_id FROM public.financial_accounts WHERE account_type = 'platform' AND is_system = true LIMIT 1;
    SELECT id INTO v_org_pool_account_id FROM public.financial_accounts WHERE account_type = 'organization_pool' AND is_system = true LIMIT 1;
    SELECT id INTO v_fee_account_id FROM public.financial_accounts WHERE account_type = 'fee' AND is_system = true LIMIT 1;

    SELECT id INTO v_impact_pool_initiative_id FROM public.initiatives WHERE is_impact_pool = true AND is_system_owned = true LIMIT 1;
    SELECT id INTO v_impact_pool_account_id FROM public.financial_accounts WHERE reference_id = v_impact_pool_initiative_id LIMIT 1;

    v_current_month := EXTRACT(MONTH FROM now());
    v_current_year := EXTRACT(YEAR FROM now());

    -- Ensure billing cycle exists
    SELECT id INTO v_billing_cycle_id FROM public.billing_cycles WHERE month = v_current_month AND year = v_current_year;
    IF v_billing_cycle_id IS NULL THEN
        INSERT INTO public.billing_cycles (month, year, start_date, end_date)
        VALUES (
            v_current_month,
            v_current_year,
            date_trunc('month', now())::date,
            (date_trunc('month', now()) + interval '1 month - 1 day')::date
        )
        RETURNING id INTO v_billing_cycle_id;
    END IF;

    -- 2. Calculate Fees
    IF v_fee_config.fee_type = 'percentage' THEN
        v_fee_amount := p_total_amount * (v_fee_config.percentage_value / 100.0);
    ELSIF v_fee_config.fee_type = 'fixed' THEN
        v_fee_amount := v_fee_config.fixed_amount_mur;
    ELSIF v_fee_config.fee_type = 'hybrid' THEN
        v_fee_amount := (p_total_amount * (v_fee_config.percentage_value / 100.0)) + v_fee_config.fixed_amount_mur;
    END IF;

    v_net_amount := p_total_amount - v_fee_amount;

    -- Fixed Share Calculation (P2-003)
    v_cg_share := ROUND(v_net_amount * 0.20, 2);
    v_org_pool_amount := v_net_amount - v_cg_share;

    -- 3. Ledger Entries
    -- A. Transaction Fee
    SELECT cached_balance_mur INTO v_prev_bal FROM public.financial_accounts WHERE id = v_fee_account_id FOR UPDATE;
    v_new_bal := v_prev_bal + v_fee_amount;
    INSERT INTO public.financial_events (payment_id, billing_cycle_id, user_id, account_id, event_type, amount_mur, previous_balance, resulting_balance)
    VALUES (p_payment_id, v_billing_cycle_id, p_user_id, v_fee_account_id, 'transaction_fee', v_fee_amount, v_prev_bal, v_new_bal);
    UPDATE public.financial_accounts SET cached_balance_mur = v_new_bal WHERE id = v_fee_account_id;

    -- B. Platform Share (20%)
    SELECT cached_balance_mur INTO v_prev_bal FROM public.financial_accounts WHERE id = v_cg_account_id FOR UPDATE;
    v_new_bal := v_prev_bal + v_cg_share;
    INSERT INTO public.financial_events (payment_id, billing_cycle_id, user_id, account_id, event_type, amount_mur, previous_balance, resulting_balance)
    VALUES (p_payment_id, v_billing_cycle_id, p_user_id, v_cg_account_id, 'platform_share', v_cg_share, v_prev_bal, v_new_bal);
    UPDATE public.financial_accounts SET cached_balance_mur = v_new_bal WHERE id = v_cg_account_id;

    -- C. Organization Pool (80%)
    SELECT cached_balance_mur INTO v_prev_bal FROM public.financial_accounts WHERE id = v_org_pool_account_id FOR UPDATE;
    v_new_bal := v_prev_bal + v_org_pool_amount;
    INSERT INTO public.financial_events (payment_id, billing_cycle_id, user_id, account_id, event_type, amount_mur, previous_balance, resulting_balance)
    VALUES (p_payment_id, v_billing_cycle_id, p_user_id, v_org_pool_account_id, 'organization_pool', v_org_pool_amount, v_prev_bal, v_new_bal);
    v_remaining_pool := v_org_pool_amount;

    -- 4. Priority Allocation
    FOR v_pref IN (
        SELECT mp.initiative_id, i.monthly_target_mur, fa.id as account_id
        FROM public.member_preferences mp
        JOIN public.initiatives i ON i.id = mp.initiative_id
        JOIN public.financial_accounts fa ON fa.reference_id = i.id
        WHERE mp.user_id = p_user_id
        ORDER BY mp.priority_level ASC
    ) LOOP
        IF v_remaining_pool <= 0 THEN
            EXIT;
        END IF;

        -- Get current cycle stats
        SELECT id, target_amount_mur, received_amount_mur INTO v_funding_cycle_id, v_cycle_target, v_cycle_received
        FROM public.initiative_funding_cycles
        WHERE initiative_id = v_pref.initiative_id AND billing_cycle_id = v_billing_cycle_id;

        IF NOT FOUND THEN
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
                v_prev_bal := v_new_bal;
                v_new_bal := v_prev_bal - v_to_allocate;

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

        IF v_remaining_pool > 0 AND v_cycle_space = 0 AND v_cycle_target > 0 THEN
             INSERT INTO public.financial_events (payment_id, billing_cycle_id, user_id, initiative_id, account_id, event_type, amount_mur, previous_balance, resulting_balance, metadata)
             VALUES (p_payment_id, v_billing_cycle_id, p_user_id, v_pref.initiative_id, v_pref.account_id, 'overflow', v_remaining_pool, 0, 0, jsonb_build_object('reason', 'target_reached'));
        END IF;
    END LOOP;

    -- 5. Impact Pool Fallback
    IF v_remaining_pool > 0 THEN
        v_prev_bal := v_new_bal;
        v_new_bal := v_prev_bal - v_remaining_pool;

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

    UPDATE public.financial_accounts SET cached_balance_mur = v_new_bal WHERE id = v_org_pool_account_id;

    -- 6. Update Supporter Counts
    UPDATE public.initiative_funding_cycles
    SET supporter_count = supporter_count + 1
    WHERE billing_cycle_id = v_billing_cycle_id
    AND initiative_id IN (
        SELECT initiative_id FROM public.financial_events
        WHERE payment_id = p_payment_id AND event_type IN ('allocation', 'impact_pool')
    );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
