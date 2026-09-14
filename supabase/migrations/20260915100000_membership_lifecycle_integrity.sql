-- Membership lifecycle integrity: pause/resume/cancel and next-cycle changes.
DO $$
BEGIN
  ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'paused';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS pending_amount_mur numeric,
  ADD COLUMN IF NOT EXISTS pending_billing_day integer;

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_pending_amount_mur_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_pending_amount_mur_check
  CHECK (pending_amount_mur IS NULL OR pending_amount_mur >= 167);

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_pending_billing_day_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_pending_billing_day_check
  CHECK (pending_billing_day IS NULL OR pending_billing_day BETWEEN 1 AND 28);

CREATE OR REPLACE FUNCTION public.manage_member_subscription(
  p_action text,
  p_amount_mur numeric DEFAULT NULL,
  p_billing_day integer DEFAULT NULL
)
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription public.subscriptions;
  v_day integer;
  v_next_date timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_action NOT IN ('pause','resume','cancel','update') THEN RAISE EXCEPTION 'Invalid membership action'; END IF;

  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE user_id = auth.uid() AND status IN ('active','paused')
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_subscription.id IS NULL THEN RAISE EXCEPTION 'No manageable membership found'; END IF;

  IF p_action = 'pause' THEN
    IF v_subscription.status <> 'active' THEN RAISE EXCEPTION 'Only an active membership can be paused'; END IF;
    UPDATE public.subscriptions
      SET status='paused', next_billing_date=NULL, updated_at=now()
      WHERE id=v_subscription.id
      RETURNING * INTO v_subscription;
    RETURN v_subscription;
  ELSIF p_action = 'cancel' THEN
    UPDATE public.subscriptions
      SET status='cancelled', next_billing_date=NULL,
          pending_amount_mur=NULL, pending_billing_day=NULL, updated_at=now()
      WHERE id=v_subscription.id
      RETURNING * INTO v_subscription;
    RETURN v_subscription;
  ELSIF p_action = 'resume' THEN
    IF v_subscription.status <> 'paused' THEN RAISE EXCEPTION 'Only a paused membership can be resumed'; END IF;
    v_day := LEAST(GREATEST(COALESCE(v_subscription.pending_billing_day, 7),1),28);
    v_next_date := date_trunc('month', now()) + make_interval(months=>1) + make_interval(days=>v_day-1);
    UPDATE public.subscriptions
      SET status='active',
          amount_mur=COALESCE(v_subscription.pending_amount_mur, v_subscription.amount_mur),
          pending_amount_mur=NULL,
          pending_billing_day=NULL,
          next_billing_date=v_next_date,
          updated_at=now()
      WHERE id=v_subscription.id
      RETURNING * INTO v_subscription;
    RETURN v_subscription;
  END IF;

  IF p_amount_mur IS NOT NULL AND p_amount_mur < 167 THEN RAISE EXCEPTION 'Membership amount must be at least Rs 167'; END IF;
  IF p_billing_day IS NOT NULL AND (p_billing_day < 1 OR p_billing_day > 28) THEN RAISE EXCEPTION 'Billing day must be between 1 and 28'; END IF;
  IF p_amount_mur IS NULL AND p_billing_day IS NULL THEN RAISE EXCEPTION 'Provide an amount or billing day to update'; END IF;

  UPDATE public.subscriptions
    SET pending_amount_mur=COALESCE(p_amount_mur,pending_amount_mur),
        pending_billing_day=COALESCE(p_billing_day,pending_billing_day),
        updated_at=now()
    WHERE id=v_subscription.id
    RETURNING * INTO v_subscription;
  RETURN v_subscription;
END;
$$;

REVOKE ALL ON FUNCTION public.manage_member_subscription(text,numeric,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_member_subscription(text,numeric,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.process_recurring_billing()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run_id uuid;
  v_sub record;
  v_payment_id uuid;
  v_processed_count integer := 0;
  v_total_mur numeric := 0;
  v_effective_amount numeric;
  v_effective_day integer;
  v_next_date timestamptz;
BEGIN
  IF EXISTS (SELECT 1 FROM public.billing_runs WHERE run_date=CURRENT_DATE AND status='completed') THEN RETURN; END IF;
  INSERT INTO public.billing_runs (run_date,status) VALUES (CURRENT_DATE,'running') RETURNING id INTO v_run_id;

  FOR v_sub IN
    SELECT * FROM public.subscriptions
    WHERE status='active' AND next_billing_date <= CURRENT_TIMESTAMP
    ORDER BY next_billing_date, created_at
    FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      v_effective_amount := COALESCE(v_sub.pending_amount_mur,v_sub.amount_mur);
      v_effective_day := LEAST(GREATEST(COALESCE(v_sub.pending_billing_day,EXTRACT(DAY FROM v_sub.next_billing_date)::integer),1),28);

      INSERT INTO public.payments (user_id,subscription_id,amount_mur,status,paid_at,reconciliation_status)
      VALUES (v_sub.user_id,v_sub.id,v_effective_amount,'success',now(),'success')
      RETURNING id INTO v_payment_id;

      PERFORM public.allocate_payment_funds(v_payment_id,v_sub.user_id,v_effective_amount);

      v_next_date := date_trunc('month',v_sub.next_billing_date) + interval '1 month' + make_interval(days=>v_effective_day-1);
      UPDATE public.subscriptions
        SET amount_mur=v_effective_amount,
            pending_amount_mur=NULL,
            pending_billing_day=NULL,
            next_billing_date=v_next_date,
            updated_at=now()
        WHERE id=v_sub.id;

      v_processed_count := v_processed_count+1;
      v_total_mur := v_total_mur+v_effective_amount;
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.audit_logs (action,entity_type,entity_id,details)
      VALUES ('billing_failure','subscription',v_sub.id,jsonb_build_object('error',SQLERRM,'run_id',v_run_id));
    END;
  END LOOP;

  UPDATE public.billing_runs
    SET status='completed',subscriptions_processed=v_processed_count,total_amount_mur=v_total_mur
    WHERE id=v_run_id;
EXCEPTION WHEN OTHERS THEN
  IF v_run_id IS NOT NULL THEN
    UPDATE public.billing_runs SET status='failed',error_log=SQLERRM WHERE id=v_run_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.process_recurring_billing() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_recurring_billing() FROM anon,authenticated;
GRANT EXECUTE ON FUNCTION public.process_recurring_billing() TO service_role;
