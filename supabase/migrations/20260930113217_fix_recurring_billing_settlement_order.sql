CREATE OR REPLACE FUNCTION public.process_recurring_billing()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_run_id uuid; v_sub record; v_payment_id uuid;
  v_processed_count integer := 0; v_total_mur numeric := 0;
  v_effective_amount numeric; v_effective_day integer; v_next_date timestamptz; v_receipt_number text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.billing_runs WHERE run_date=CURRENT_DATE AND status='completed') THEN RETURN; END IF;
  INSERT INTO public.billing_runs (run_date,status) VALUES (CURRENT_DATE,'running') RETURNING id INTO v_run_id;
  FOR v_sub IN
    SELECT * FROM public.subscriptions
    WHERE status='active' AND next_billing_date <= CURRENT_TIMESTAMP
    ORDER BY next_billing_date, created_at FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      v_effective_amount := COALESCE(v_sub.pending_amount_mur,v_sub.amount_mur);
      v_effective_day := LEAST(GREATEST(COALESCE(v_sub.pending_billing_day,EXTRACT(DAY FROM v_sub.next_billing_date)::integer),1),28);
      INSERT INTO public.payments (user_id,subscription_id,amount_mur,status,reconciliation_status)
      VALUES (v_sub.user_id,v_sub.id,v_effective_amount,'pending','pending')
      RETURNING id INTO v_payment_id;
      PERFORM public.allocate_payment_funds(v_payment_id,v_sub.user_id,v_effective_amount);
      UPDATE public.payments SET status='success', paid_at=now(), reconciliation_status='success' WHERE id=v_payment_id;
      v_receipt_number := 'CG-REC-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      INSERT INTO public.receipts (payment_id,user_id,receipt_number,amount_mur) VALUES (v_payment_id,v_sub.user_id,v_receipt_number,v_effective_amount);
      v_next_date := date_trunc('month',v_sub.next_billing_date) + interval '1 month' + make_interval(days=>v_effective_day-1);
      UPDATE public.subscriptions SET amount_mur=v_effective_amount,pending_amount_mur=NULL,pending_billing_day=NULL,next_billing_date=v_next_date,updated_at=now() WHERE id=v_sub.id;
      v_processed_count := v_processed_count+1; v_total_mur := v_total_mur+v_effective_amount;
    EXCEPTION WHEN OTHERS THEN
      IF v_payment_id IS NOT NULL THEN
        UPDATE public.payments SET status='failed', reconciliation_status='failed', failure_reason=SQLERRM WHERE id=v_payment_id AND status='pending';
      END IF;
      INSERT INTO public.audit_logs (action,entity_type,entity_id,details)
      VALUES ('billing_failure','subscription',v_sub.id,jsonb_build_object('error',SQLERRM,'run_id',v_run_id,'payment_id',v_payment_id));
    END;
  END LOOP;
  UPDATE public.billing_runs SET status='completed',subscriptions_processed=v_processed_count,total_amount_mur=v_total_mur WHERE id=v_run_id;
EXCEPTION WHEN OTHERS THEN
  IF v_run_id IS NOT NULL THEN UPDATE public.billing_runs SET status='failed',error_log=SQLERRM WHERE id=v_run_id; END IF;
END;
$function$;