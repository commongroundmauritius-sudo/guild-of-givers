CREATE OR REPLACE FUNCTION public.manage_member_subscription(p_action text,p_amount_mur numeric DEFAULT NULL,p_billing_day integer DEFAULT NULL)
RETURNS public.subscriptions LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE v_subscription public.subscriptions; v_day integer; v_next_date timestamptz;
BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
IF p_action NOT IN ('pause','resume','cancel','update') THEN RAISE EXCEPTION 'Invalid membership action'; END IF;
SELECT * INTO v_subscription FROM public.subscriptions WHERE user_id=auth.uid() AND status IN ('active','paused') ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
IF v_subscription.id IS NULL THEN RAISE EXCEPTION 'No manageable membership found'; END IF;
IF p_action='pause' THEN
 IF v_subscription.status<>'active' THEN RAISE EXCEPTION 'Only an active membership can be paused'; END IF;
 UPDATE public.subscriptions SET status='paused',next_billing_date=NULL,updated_at=now() WHERE id=v_subscription.id RETURNING * INTO v_subscription; RETURN v_subscription;
ELSIF p_action='cancel' THEN
 UPDATE public.subscriptions SET status='cancelled',next_billing_date=NULL,pending_amount_mur=NULL,pending_billing_day=NULL,updated_at=now() WHERE id=v_subscription.id RETURNING * INTO v_subscription; RETURN v_subscription;
ELSIF p_action='resume' THEN
 IF v_subscription.status<>'paused' THEN RAISE EXCEPTION 'Only a paused membership can be resumed'; END IF;
 v_day:=LEAST(GREATEST(COALESCE(v_subscription.pending_billing_day,7),1),28);
 v_next_date:=date_trunc('month',now())+make_interval(months=>1)+make_interval(days=>v_day-1);
 UPDATE public.subscriptions SET status='active',amount_mur=COALESCE(p_amount_mur,pending_amount_mur,amount_mur),pending_amount_mur=NULL,pending_billing_day=NULL,next_billing_date=v_next_date,updated_at=now() WHERE id=v_subscription.id RETURNING * INTO v_subscription; RETURN v_subscription;
END IF;
IF p_amount_mur IS NOT NULL AND p_amount_mur<167 THEN RAISE EXCEPTION 'Membership amount must be at least Rs 167'; END IF;
IF p_billing_day IS NOT NULL AND (p_billing_day<1 OR p_billing_day>28) THEN RAISE EXCEPTION 'Billing day must be between 1 and 28'; END IF;
IF p_amount_mur IS NULL AND p_billing_day IS NULL THEN RAISE EXCEPTION 'Provide an amount or billing day to update'; END IF;
UPDATE public.subscriptions SET pending_amount_mur=COALESCE(p_amount_mur,pending_amount_mur),pending_billing_day=COALESCE(p_billing_day,pending_billing_day),updated_at=now() WHERE id=v_subscription.id RETURNING * INTO v_subscription;
RETURN v_subscription;
END; $$;
REVOKE ALL ON FUNCTION public.manage_member_subscription(text,numeric,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_member_subscription(text,numeric,integer) TO authenticated;