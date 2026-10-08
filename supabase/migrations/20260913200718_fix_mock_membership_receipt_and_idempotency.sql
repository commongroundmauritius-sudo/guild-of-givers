CREATE UNIQUE INDEX IF NOT EXISTS payments_mock_provider_payment_uidx ON public.payments (peach_payment_id) WHERE peach_payment_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.dev_complete_mock_membership(
  p_amount_mur numeric,
  p_billing_date integer,
  p_covers_fees boolean,
  p_transaction_id text,
  p_priority_initiatives uuid[] DEFAULT '{}'::uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_subscription_id uuid;
  v_payment_id uuid;
  v_existing_payment_id uuid;
  v_next_billing date;
  v_receipt_number text;
  v_priority uuid;
  v_priority_level integer := 1;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_amount_mur < 167 THEN RAISE EXCEPTION 'Minimum membership amount is Rs 167'; END IF;
  IF p_billing_date < 1 OR p_billing_date > 31 THEN RAISE EXCEPTION 'Invalid billing date'; END IF;
  IF p_transaction_id IS NULL OR p_transaction_id NOT LIKE 'mock_txn_%' THEN RAISE EXCEPTION 'Invalid mock transaction'; END IF;

  SELECT id INTO v_existing_payment_id FROM public.payments WHERE peach_payment_id = p_transaction_id LIMIT 1;
  IF v_existing_payment_id IS NOT NULL THEN
    SELECT subscription_id INTO v_subscription_id FROM public.payments WHERE id = v_existing_payment_id;
    SELECT receipt_number INTO v_receipt_number FROM public.receipts WHERE payment_id = v_existing_payment_id LIMIT 1;
    RETURN jsonb_build_object('success', true, 'subscription_id', v_subscription_id, 'payment_id', v_existing_payment_id, 'receipt_number', v_receipt_number, 'already_processed', true);
  END IF;

  SELECT id INTO v_subscription_id FROM public.subscriptions WHERE user_id = v_user_id AND status = 'active' ORDER BY created_at DESC LIMIT 1;
  IF v_subscription_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'subscription_id', v_subscription_id, 'already_active', true);
  END IF;

  v_next_billing := make_date(EXTRACT(YEAR FROM CURRENT_DATE)::integer, EXTRACT(MONTH FROM CURRENT_DATE)::integer, LEAST(p_billing_date, EXTRACT(DAY FROM (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day'))::integer));
  IF v_next_billing <= CURRENT_DATE THEN
    v_next_billing := make_date(EXTRACT(YEAR FROM (CURRENT_DATE + interval '1 month'))::integer, EXTRACT(MONTH FROM (CURRENT_DATE + interval '1 month'))::integer, LEAST(p_billing_date, EXTRACT(DAY FROM (date_trunc('month', CURRENT_DATE + interval '1 month') + interval '1 month - 1 day'))::integer));
  END IF;

  INSERT INTO public.subscriptions (user_id, amount_mur, status, peach_subscription_id, next_billing_date, covers_fees, start_date, billing_cycle)
  VALUES (v_user_id, p_amount_mur, 'active', 'mock_sub_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12), v_next_billing, p_covers_fees, now(), 'monthly')
  RETURNING id INTO v_subscription_id;

  IF COALESCE(array_length(p_priority_initiatives, 1), 0) > 0 THEN
    FOREACH v_priority IN ARRAY p_priority_initiatives LOOP
      IF v_priority IS NOT NULL AND EXISTS (SELECT 1 FROM public.initiatives WHERE id = v_priority) THEN
        INSERT INTO public.member_preferences (user_id, initiative_id, priority_level)
        VALUES (v_user_id, v_priority, v_priority_level)
        ON CONFLICT (user_id, initiative_id) DO UPDATE SET priority_level = EXCLUDED.priority_level;
        v_priority_level := v_priority_level + 1;
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.payments (user_id, subscription_id, amount_mur, status, peach_payment_id, paid_at, currency, reconciliation_status, webhook_event_id, gateway_response)
  VALUES (v_user_id, v_subscription_id, p_amount_mur, 'success', p_transaction_id, now(), 'MUR', 'success', p_transaction_id, jsonb_build_object('provider', 'MockProvider', 'event', 'payment.success'))
  RETURNING id INTO v_payment_id;

  PERFORM public.allocate_payment_funds(v_payment_id, v_user_id, p_amount_mur);

  v_receipt_number := 'CG-MOCK-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  INSERT INTO public.receipts (payment_id, user_id, receipt_number, amount_mur) VALUES (v_payment_id, v_user_id, v_receipt_number, p_amount_mur);

  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'member') ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'subscription_id', v_subscription_id, 'payment_id', v_payment_id, 'receipt_number', v_receipt_number, 'next_billing_date', v_next_billing);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.dev_complete_mock_membership(numeric, integer, boolean, text, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dev_complete_mock_membership(numeric, integer, boolean, text, uuid[]) TO authenticated;
