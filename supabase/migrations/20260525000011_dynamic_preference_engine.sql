-- Dynamic Preference Allocation Engine
-- Resolves requirements for unlimited priorities and multi-selection processing order

BEGIN;

-- 1. Hardening member_preferences constraints
ALTER TABLE public.member_preferences
DROP CONSTRAINT IF EXISTS member_preferences_user_id_initiative_id_key;
ALTER TABLE public.member_preferences
ADD CONSTRAINT member_preferences_user_id_initiative_id_key UNIQUE (user_id, initiative_id);

ALTER TABLE public.member_preferences
DROP CONSTRAINT IF EXISTS unique_user_priority;
ALTER TABLE public.member_preferences
ADD CONSTRAINT unique_user_priority UNIQUE (user_id, priority_level);

-- 2. Update process_recurring_billing to prioritize multi-selection members
CREATE OR REPLACE FUNCTION public.process_recurring_billing()
RETURNS void AS $$
DECLARE
    v_run_id UUID;
    v_sub RECORD;
    v_payment_id UUID;
    v_processed_count INTEGER := 0;
    v_total_mur NUMERIC := 0;
BEGIN
    -- Idempotency check
    IF EXISTS (SELECT 1 FROM public.billing_runs WHERE run_date = CURRENT_DATE AND status = 'completed') THEN
        RETURN;
    END IF;

    INSERT INTO public.billing_runs (run_date, status)
    VALUES (CURRENT_DATE, 'running')
    RETURNING id INTO v_run_id;

    -- NEW: Order by preference count DESC (multi-selection first)
    FOR v_sub IN
        SELECT s.*,
               (SELECT count(*) FROM public.member_preferences WHERE user_id = s.user_id) as pref_count
        FROM public.subscriptions s
        WHERE s.status = 'active'
        AND s.next_billing_date <= CURRENT_TIMESTAMP
        ORDER BY pref_count DESC, s.created_at ASC
    LOOP
        BEGIN
            INSERT INTO public.payments (user_id, subscription_id, amount_mur, status, paid_at)
            VALUES (v_sub.user_id, v_sub.id, v_sub.amount_mur, 'success', now())
            RETURNING id INTO v_payment_id;

            PERFORM public.allocate_payment_funds(v_payment_id, v_sub.user_id, v_sub.amount_mur);

            UPDATE public.subscriptions
            SET next_billing_date = next_billing_date + interval '1 month',
                updated_at = now()
            WHERE id = v_sub.id;

            v_processed_count := v_processed_count + 1;
            v_total_mur := v_total_mur + v_sub.amount_mur;

        EXCEPTION WHEN OTHERS THEN
            INSERT INTO public.audit_logs (action, entity_type, entity_id, details)
            VALUES ('billing_failure', 'subscription', v_sub.id, jsonb_build_object('error', SQLERRM, 'run_id', v_run_id));
        END;
    END LOOP;

    UPDATE public.billing_runs
    SET status = 'completed',
        subscriptions_processed = v_processed_count,
        total_amount_mur = v_total_mur
    WHERE id = v_run_id;

EXCEPTION WHEN OTHERS THEN
    UPDATE public.billing_runs
    SET status = 'failed',
        error_log = SQLERRM
    WHERE id = v_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. The existing allocate_payment_funds (from 20260525000006) already supports unlimited iterations
-- through its 'FOR v_pref IN (SELECT ... ORDER BY priority_level ASC)' loop.
-- No further changes needed to the allocation loop.

COMMIT;
