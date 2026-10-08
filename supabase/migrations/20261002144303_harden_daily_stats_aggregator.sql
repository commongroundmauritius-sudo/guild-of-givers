CREATE OR REPLACE FUNCTION public.aggregate_daily_stats(p_date date DEFAULT (CURRENT_DATE - INTERVAL '1 day'))
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    INSERT INTO public.daily_initiative_stats (initiative_id, date, view_count, registration_count, subscription_count, successful_payment_count, total_revenue_mur, failed_payment_count)
    SELECT i.id, p_date,
      COUNT(CASE WHEN e.event_type = 'page_view' THEN 1 END),
      COUNT(CASE WHEN e.event_type = 'registration_conversion' THEN 1 END),
      COUNT(CASE WHEN e.event_type = 'subscription_started' THEN 1 END),
      COUNT(CASE WHEN e.event_type = 'payment_completed' THEN 1 END),
      COALESCE(SUM(CASE WHEN e.event_type = 'payment_completed' THEN (e.metadata->>'amount_mur')::NUMERIC ELSE 0 END), 0),
      COUNT(CASE WHEN e.event_type = 'payment_failed' THEN 1 END)
    FROM public.initiatives i
    LEFT JOIN public.initiative_events e ON i.id = e.initiative_id AND e.created_at::DATE = p_date
    GROUP BY i.id
    ON CONFLICT (initiative_id, date) DO UPDATE SET
      view_count=EXCLUDED.view_count, registration_count=EXCLUDED.registration_count, subscription_count=EXCLUDED.subscription_count,
      successful_payment_count=EXCLUDED.successful_payment_count, total_revenue_mur=EXCLUDED.total_revenue_mur, failed_payment_count=EXCLUDED.failed_payment_count;

    INSERT INTO public.daily_campaign_stats (campaign_link_id, date, view_count, registration_count, subscription_count, successful_payment_count, total_revenue_mur, failed_payment_count)
    SELECT cl.id, p_date,
      COUNT(CASE WHEN e.event_type = 'page_view' THEN 1 END),
      COUNT(CASE WHEN e.event_type = 'registration_conversion' THEN 1 END),
      COUNT(CASE WHEN e.event_type = 'subscription_started' THEN 1 END),
      COUNT(CASE WHEN e.event_type = 'payment_completed' THEN 1 END),
      COALESCE(SUM(CASE WHEN e.event_type = 'payment_completed' THEN (e.metadata->>'amount_mur')::NUMERIC ELSE 0 END), 0),
      COUNT(CASE WHEN e.event_type = 'payment_failed' THEN 1 END)
    FROM public.campaign_links cl
    LEFT JOIN public.initiative_events e ON cl.id = e.campaign_link_id AND e.created_at::DATE = p_date
    GROUP BY cl.id
    ON CONFLICT (campaign_link_id, date) DO UPDATE SET
      view_count=EXCLUDED.view_count, registration_count=EXCLUDED.registration_count, subscription_count=EXCLUDED.subscription_count,
      successful_payment_count=EXCLUDED.successful_payment_count, total_revenue_mur=EXCLUDED.total_revenue_mur, failed_payment_count=EXCLUDED.failed_payment_count;

    INSERT INTO public.daily_revenue_stats (date, total_revenue_mur, total_payments, failed_payments, active_subscriptions)
    SELECT p_date,
      COALESCE(SUM(CASE WHEN status='success' THEN amount_mur ELSE 0 END),0),
      COUNT(CASE WHEN status='success' THEN 1 END),
      COUNT(CASE WHEN status='failed' THEN 1 END),
      (SELECT COUNT(*) FROM public.subscriptions WHERE status='active')
    FROM public.payments WHERE created_at::DATE=p_date
    ON CONFLICT (date) DO UPDATE SET
      total_revenue_mur=EXCLUDED.total_revenue_mur, total_payments=EXCLUDED.total_payments,
      failed_payments=EXCLUDED.failed_payments, active_subscriptions=EXCLUDED.active_subscriptions;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.aggregate_daily_stats(date) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aggregate_daily_stats(date) TO service_role;
