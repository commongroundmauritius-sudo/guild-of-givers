DO $$
DECLARE
    v_payment RECORD;
    v_alloc RECORD;
    v_billing_cycle_id UUID;
    v_p_month INTEGER;
    v_p_year INTEGER;

    v_cg_account_id UUID;
    v_fee_account_id UUID;
    v_org_pool_account_id UUID;
    v_initiative_account_id UUID;

    v_prev_bal NUMERIC;
    v_fee_amount NUMERIC := 0;
    v_cg_share NUMERIC;
    v_allocated_total NUMERIC;
BEGIN
    SELECT id INTO v_cg_account_id FROM public.financial_accounts WHERE account_type = 'platform'  LIMIT 1;
    SELECT id INTO v_fee_account_id FROM public.financial_accounts WHERE account_type = 'fee'  LIMIT 1;
    SELECT id INTO v_org_pool_account_id FROM public.financial_accounts WHERE account_type = 'organization_pool'  LIMIT 1;

    -- 1. Create billing cycles for all historical payments
    FOR v_p_month, v_p_year IN
        SELECT DISTINCT EXTRACT(MONTH FROM paid_at)::INTEGER, EXTRACT(YEAR FROM paid_at)::INTEGER
        FROM public.payments WHERE status = 'success' AND paid_at IS NOT NULL
    LOOP
        INSERT INTO public.billing_cycles (month, year, start_date, end_date)
        VALUES (
            v_p_month,
            v_p_year,
            (v_p_year || '-' || v_p_month || '-01')::DATE,
            ((v_p_year || '-' || v_p_month || '-01')::DATE + interval '1 month - 1 day')::DATE
        )
        ON CONFLICT (month, year) DO NOTHING;
    END LOOP;

    -- 2. Backfill events
    FOR v_payment IN
        SELECT p.*, EXTRACT(MONTH FROM p.paid_at)::INTEGER as m, EXTRACT(YEAR FROM p.paid_at)::INTEGER as y
        FROM public.payments p
        WHERE p.status = 'success' AND p.paid_at IS NOT NULL
        ORDER BY p.paid_at ASC
    LOOP
        SELECT id INTO v_billing_cycle_id FROM public.billing_cycles WHERE month = v_payment.m AND year = v_payment.y;

        -- Sum existing allocations for this payment
        SELECT COALESCE(SUM(amount_mur), 0) INTO v_allocated_total FROM public.allocations WHERE payment_id = v_payment.id;

        -- In historical data, total - allocations = fees + platform share.
        v_cg_share := v_payment.amount_mur - v_allocated_total;

        -- A. Platform Share (The remainder)
        SELECT cached_balance_mur INTO v_prev_bal FROM public.financial_accounts WHERE id = v_cg_account_id;
        INSERT INTO public.financial_events (payment_id, billing_cycle_id, user_id, account_id, event_type, amount_mur, previous_balance, resulting_balance)
        VALUES (v_payment.id, v_billing_cycle_id, v_payment.user_id, v_cg_account_id, 'platform_share', v_cg_share, v_prev_bal, v_prev_bal + v_cg_share);
        UPDATE public.financial_accounts SET cached_balance_mur = v_prev_bal + v_cg_share WHERE id = v_cg_account_id;

        -- B. Organization Pool (Pass through for the allocations)
        SELECT cached_balance_mur INTO v_prev_bal FROM public.financial_accounts WHERE id = v_org_pool_account_id;
        INSERT INTO public.financial_events (payment_id, billing_cycle_id, user_id, account_id, event_type, amount_mur, previous_balance, resulting_balance)
        VALUES (v_payment.id, v_billing_cycle_id, v_payment.user_id, v_org_pool_account_id, 'organization_pool', v_allocated_total, v_prev_bal, v_prev_bal + v_allocated_total);

        -- C. Allocations
        FOR v_alloc IN SELECT * FROM public.allocations WHERE payment_id = v_payment.id LOOP
            SELECT id INTO v_initiative_account_id FROM public.financial_accounts WHERE reference_id = v_alloc.initiative_id;

            IF v_initiative_account_id IS NOT NULL THEN
                SELECT cached_balance_mur INTO v_prev_bal FROM public.financial_accounts WHERE id = v_initiative_account_id;
                INSERT INTO public.financial_events (payment_id, billing_cycle_id, user_id, initiative_id, account_id, event_type, amount_mur, previous_balance, resulting_balance)
                VALUES (v_payment.id, v_billing_cycle_id, v_payment.user_id, v_alloc.initiative_id, v_initiative_account_id, 'allocation', v_alloc.amount_mur, v_prev_bal, v_prev_bal + v_alloc.amount_mur);
                UPDATE public.financial_accounts SET cached_balance_mur = v_prev_bal + v_alloc.amount_mur WHERE id = v_initiative_account_id;

                -- Backfill funding cycle metrics
                INSERT INTO public.initiative_funding_cycles (initiative_id, billing_cycle_id, month, year, target_amount_mur, received_amount_mur, supporter_count)
                VALUES (v_alloc.initiative_id, v_billing_cycle_id, v_payment.m, v_payment.y, 0, v_alloc.amount_mur, 1)
                ON CONFLICT (initiative_id, billing_cycle_id) DO UPDATE SET
                    received_amount_mur = initiative_funding_cycles.received_amount_mur + EXCLUDED.received_amount_mur,
                    supporter_count = initiative_funding_cycles.supporter_count + 1;
            END IF;
        END LOOP;
    END LOOP;
END $$;
