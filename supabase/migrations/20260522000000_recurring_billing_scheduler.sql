-- Enable pg_cron if available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Audit table for billing runs
CREATE TABLE IF NOT EXISTS public.billing_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subscriptions_processed INTEGER DEFAULT 0,
    total_amount_mur NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'running',
    error_log TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(run_date)
);

-- Enable RLS for billing_runs
ALTER TABLE public.billing_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view billing runs" ON public.billing_runs FOR SELECT USING (public.has_role('admin'));

-- Allocation Sub-function
CREATE OR REPLACE FUNCTION public.allocate_payment_funds(p_payment_id UUID, p_user_id UUID, p_total_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
    v_net_pool NUMERIC;
    v_remaining NUMERIC;
    v_pref RECORD;
    v_initiative_id UUID;
    v_cap NUMERIC;
    v_current NUMERIC;
    v_space NUMERIC;
    v_to_allocate NUMERIC;
    v_impact_pool_id UUID;
    v_potential NUMERIC;
    v_pref_count INTEGER;
BEGIN
    -- 20/80 Split
    v_net_pool := p_total_amount * 0.80;
    v_remaining := v_net_pool;

    -- Get Impact Pool ID
    SELECT id INTO v_impact_pool_id FROM public.initiatives WHERE is_impact_pool = true LIMIT 1;

    -- Count preferences for potential split calculation
    SELECT count(*) INTO v_pref_count FROM public.member_preferences WHERE user_id = p_user_id;
    IF v_pref_count = 0 THEN
        v_potential := 0;
    ELSE
        v_potential := v_net_pool / v_pref_count;
    END IF;

    -- Process Priorities
    FOR v_pref IN
        SELECT mp.initiative_id, i.goal_amount_mur, i.current_amount_mur
        FROM public.member_preferences mp
        JOIN public.initiatives i ON i.id = mp.initiative_id
        WHERE mp.user_id = p_user_id
        ORDER BY mp.priority_level ASC, mp.created_at ASC
    LOOP
        EXIT WHEN v_remaining <= 0;

        v_cap := COALESCE(v_pref.goal_amount_mur, 999999999);
        v_current := COALESCE(v_pref.current_amount_mur, 0);
        v_space := GREATEST(0, v_cap - v_current);

        v_to_allocate := LEAST(v_remaining, v_space);

        IF v_to_allocate > 0 THEN
            INSERT INTO public.allocations (payment_id, initiative_id, amount_mur, potential_amount_mur, is_overflow)
            VALUES (p_payment_id, v_pref.initiative_id, v_to_allocate, v_potential, v_to_allocate < v_potential);

            PERFORM public.increment_initiative_amount(v_pref.initiative_id, v_to_allocate);
            v_remaining := v_remaining - v_to_allocate;
        END IF;
    LOOP END;

    -- Final Fallback to Impact Pool
    IF v_remaining > 0 AND v_impact_pool_id IS NOT NULL THEN
        INSERT INTO public.allocations (payment_id, initiative_id, amount_mur, potential_amount_mur, is_overflow)
        VALUES (p_payment_id, v_impact_pool_id, v_remaining, 0, true);

        PERFORM public.increment_initiative_amount(v_impact_pool_id, v_remaining);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main Scheduler Function
CREATE OR REPLACE FUNCTION public.process_recurring_billing()
RETURNS VOID AS $$
DECLARE
    v_run_id UUID;
    v_sub RECORD;
    v_payment_id UUID;
    v_processed_count INTEGER := 0;
    v_total_mur NUMERIC := 0;
BEGIN
    -- Idempotency check: Don't run twice for the same day
    IF EXISTS (SELECT 1 FROM public.billing_runs WHERE run_date = CURRENT_DATE AND status = 'completed') THEN
        RETURN;
    END IF;

    INSERT INTO public.billing_runs (run_date, status)
    VALUES (CURRENT_DATE, 'running')
    RETURNING id INTO v_run_id;

    -- Iterate over active subscriptions due today
    FOR v_sub IN
        SELECT * FROM public.subscriptions
        WHERE status = 'active'
        AND next_billing_date <= CURRENT_TIMESTAMP
    LOOP
        BEGIN
            -- 1. Create Payment Record
            INSERT INTO public.payments (user_id, subscription_id, amount_mur, status, paid_at)
            VALUES (v_sub.user_id, v_sub.id, v_sub.amount_mur, 'success', now())
            RETURNING id INTO v_payment_id;

            -- 2. Run Allocation
            PERFORM public.allocate_payment_funds(v_payment_id, v_sub.user_id, v_sub.amount_mur);

            -- 3. Update Subscription (next month)
            UPDATE public.subscriptions
            SET next_billing_date = next_billing_date + interval '1 month',
                updated_at = now()
            WHERE id = v_sub.id;

            v_processed_count := v_processed_count + 1;
            v_total_mur := v_total_mur + v_sub.amount_mur;

        EXCEPTION WHEN OTHERS THEN
            -- Log error for specific subscription but continue loop
            INSERT INTO public.audit_logs (action, entity_type, entity_id, details)
            VALUES ('billing_failure', 'subscription', v_sub.id, jsonb_build_object('error', SQLERRM, 'run_id', v_run_id));
        END;
    END LOOP;

    -- Update run stats
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the task (requires pg_cron)
-- Note: On some Supabase environments, this must be executed as 'postgres' role.
-- We wrap it in a block to avoid failing if pg_cron isn't fully enabled in the sandbox yet.
DO $$
BEGIN
    PERFORM cron.schedule('recurring-billing-midnight', '0 0 * * *', 'SELECT public.process_recurring_billing()');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not schedule cron job: %', SQLERRM;
END $$;
