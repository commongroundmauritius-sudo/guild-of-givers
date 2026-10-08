ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
UPDATE public.payments SET is_test=true WHERE is_test=false AND peach_payment_id IS NULL AND reconciliation_status <> 'success';
UPDATE public.payments SET is_test=true WHERE is_test=false AND peach_payment_id IS NULL AND created_at < timestamptz '2026-09-30 00:00:00+00';
CREATE OR REPLACE FUNCTION public.get_admin_financial_metrics()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
 v_month_start timestamptz:=date_trunc('month',now()); v_next_month timestamptz:=v_month_start+interval '1 month'; v_last_month_start timestamptz:=v_month_start-interval '1 month';
 v_monthly_revenue numeric:=0; v_last_month_revenue numeric:=0; v_lifetime_revenue numeric:=0; v_avg_payment numeric:=0; v_platform_share numeric:=0; v_organization_pool_share numeric:=0; v_active_recurring numeric:=0;
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role IN ('admin','super_admin')) THEN RAISE EXCEPTION 'Unauthorized: Admin access required'; END IF;
 SELECT COALESCE(sum(amount_mur),0) INTO v_monthly_revenue FROM public.payments WHERE status='success' AND is_test=false AND COALESCE(paid_at,created_at)>=v_month_start AND COALESCE(paid_at,created_at)<v_next_month;
 SELECT COALESCE(sum(amount_mur),0) INTO v_last_month_revenue FROM public.payments WHERE status='success' AND is_test=false AND COALESCE(paid_at,created_at)>=v_last_month_start AND COALESCE(paid_at,created_at)<v_month_start;
 SELECT COALESCE(sum(amount_mur),0),COALESCE(avg(amount_mur),0) INTO v_lifetime_revenue,v_avg_payment FROM public.payments WHERE status='success' AND is_test=false;
 v_platform_share:=v_lifetime_revenue*0.20; v_organization_pool_share:=v_lifetime_revenue*0.80;
 SELECT COALESCE(sum(amount_mur),0) INTO v_active_recurring FROM public.subscriptions WHERE status='active';
 RETURN jsonb_build_object('monthly_revenue',v_monthly_revenue,'last_month_revenue',v_last_month_revenue,'avg_payment',v_avg_payment,'lifetime_revenue',v_lifetime_revenue,'platform_share',v_platform_share,'organization_pool_share',v_organization_pool_share,'monthly_recurring_forecast',v_active_recurring);
END;
$$;