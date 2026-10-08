ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'paused';

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
  v_next_date timestamptz;
  v_day integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO v_subscription FROM public.subscriptions
  WHERE user_id = auth.uid() AND status IN ('active','paused')
  ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF v_subscription.id IS NULL THEN RAISE EXCEPTION 'No manageable membership found'; END IF;
  IF p_action NOT IN ('pause','resume','cancel','update') THEN RAISE EXCEPTION 'Invalid membership action'; END IF;
  IF p_action = 'pause' THEN
    IF v_subscription.status <> 'active' THEN RAISE EXCEPTION 'Only an active membership can be paused'; END IF;
    UPDATE public.subscriptions SET status='paused', next_billing_date=NULL, updated_at=now() WHERE id=v_subscription.id RETURNING * INTO v_subscription;
    RETURN v_subscription;
  END IF;
  IF p_action = 'cancel' THEN
    UPDATE public.subscriptions SET status='cancelled', next_billing_date=NULL, updated_at=now() WHERE id=v_subscription.id RETURNING * INTO v_subscription;
    RETURN v_subscription;
  END IF;
  IF p_action = 'resume' THEN
    IF v_subscription.status <> 'paused' THEN RAISE EXCEPTION 'Only a paused membership can be resumed'; END IF;
    v_day := LEAST(GREATEST(COALESCE(p_billing_day, EXTRACT(DAY FROM v_subscription.start_date)::integer),1),28);
    v_next_date := date_trunc('month',now()) + make_interval(months=>1) + make_interval(days=>v_day-1);
    UPDATE public.subscriptions SET status='active', next_billing_date=v_next_date, updated_at=now() WHERE id=v_subscription.id RETURNING * INTO v_subscription;
    RETURN v_subscription;
  END IF;
  IF p_amount_mur IS NOT NULL AND p_amount_mur < 167 THEN RAISE EXCEPTION 'Membership amount must be at least Rs 167'; END IF;
  IF p_amount_mur IS NOT NULL THEN v_subscription.amount_mur := p_amount_mur; END IF;
  IF p_billing_day IS NOT NULL AND (p_billing_day < 1 OR p_billing_day > 28) THEN RAISE EXCEPTION 'Billing day must be between 1 and 28'; END IF;
  v_day := LEAST(GREATEST(COALESCE(p_billing_day,EXTRACT(DAY FROM COALESCE(v_subscription.next_billing_date,v_subscription.start_date))::integer),1),28);
  v_next_date := date_trunc('month',now()) + make_interval(months=>1) + make_interval(days=>v_day-1);
  UPDATE public.subscriptions SET amount_mur=COALESCE(p_amount_mur,amount_mur), next_billing_date=CASE WHEN status='active' THEN v_next_date ELSE next_billing_date END, updated_at=now() WHERE id=v_subscription.id RETURNING * INTO v_subscription;
  RETURN v_subscription;
END;
$$;
REVOKE ALL ON FUNCTION public.manage_member_subscription(text,numeric,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_member_subscription(text,numeric,integer) TO authenticated;