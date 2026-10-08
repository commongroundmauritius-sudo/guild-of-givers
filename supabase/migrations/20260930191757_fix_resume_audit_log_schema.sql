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
  v_user_id uuid := auth.uid();
  v_effective_amount numeric;
  v_next_billing_date date;
  v_payment_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT *
    INTO v_subscription
  FROM public.subscriptions
  WHERE user_id = v_user_id
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;

  IF p_action = 'pause' THEN
    IF v_subscription.status <> 'active' THEN
      RAISE EXCEPTION 'Only active subscriptions can be paused';
    END IF;

    UPDATE public.subscriptions
    SET status = 'paused',
        updated_at = now()
    WHERE id = v_subscription.id
    RETURNING * INTO v_subscription;

  ELSIF p_action = 'resume' THEN
    IF v_subscription.status <> 'paused' THEN
      RAISE EXCEPTION 'Only paused subscriptions can be resumed';
    END IF;

    v_effective_amount := COALESCE(v_subscription.amount_mur, 0);

    IF v_effective_amount < 167 THEN
      RAISE EXCEPTION 'Membership amount must be at least Rs 167';
    END IF;

    INSERT INTO public.payments (
      user_id,
      subscription_id,
      amount_mur,
      status,
      payment_method,
      provider,
      metadata
    )
    VALUES (
      v_user_id,
      v_subscription.id,
      v_effective_amount,
      'pending',
      'mock',
      'mock',
      jsonb_build_object('source', 'membership_resume')
    )
    RETURNING id INTO v_payment_id;

    PERFORM public.allocate_payment_funds(v_payment_id);

    UPDATE public.payments
    SET status = 'succeeded',
        paid_at = now(),
        updated_at = now()
    WHERE id = v_payment_id;

    INSERT INTO public.payment_receipts (
      payment_id,
      user_id,
      receipt_number,
      amount_mur,
      issued_at
    )
    VALUES (
      v_payment_id,
      v_user_id,
      'R-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
      v_effective_amount,
      now()
    );

    v_next_billing_date := (
      date_trunc('month', CURRENT_DATE)
      + INTERVAL '1 month'
      + (LEAST(COALESCE(v_subscription.billing_day, EXTRACT(day FROM CURRENT_DATE)::integer), 28) - 1) * INTERVAL '1 day'
    )::date;

    UPDATE public.subscriptions
    SET status = 'active',
        next_billing_date = v_next_billing_date,
        updated_at = now()
    WHERE id = v_subscription.id
    RETURNING * INTO v_subscription;

    INSERT INTO public.audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      new_data
    )
    VALUES (
      v_user_id,
      'membership_resumed_and_billed',
      'subscription',
      v_subscription.id,
      jsonb_build_object(
        'payment_id', v_payment_id,
        'amount_mur', v_effective_amount,
        'next_billing_date', v_next_billing_date
      )
    );

  ELSIF p_action = 'cancel' THEN
    UPDATE public.subscriptions
    SET status = 'cancelled',
        cancelled_at = now(),
        updated_at = now()
    WHERE id = v_subscription.id
    RETURNING * INTO v_subscription;

  ELSIF p_action = 'update' THEN
    IF p_amount_mur IS NOT NULL THEN
      IF p_amount_mur < 167 THEN
        RAISE EXCEPTION 'Membership amount must be at least Rs 167';
      END IF;

      UPDATE public.subscriptions
      SET pending_amount_mur = p_amount_mur,
          updated_at = now()
      WHERE id = v_subscription.id;
    END IF;

    IF p_billing_day IS NOT NULL THEN
      IF p_billing_day < 1 OR p_billing_day > 28 THEN
        RAISE EXCEPTION 'Billing day must be between 1 and 28';
      END IF;

      UPDATE public.subscriptions
      SET pending_billing_day = p_billing_day,
          updated_at = now()
      WHERE id = v_subscription.id;
    END IF;

    SELECT *
      INTO v_subscription
    FROM public.subscriptions
    WHERE id = v_subscription.id;

  ELSE
    RAISE EXCEPTION 'Unsupported subscription action: %', p_action;
  END IF;

  RETURN v_subscription;
END;
$$;

REVOKE ALL ON FUNCTION public.manage_member_subscription(text, numeric, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_member_subscription(text, numeric, integer) TO authenticated;
