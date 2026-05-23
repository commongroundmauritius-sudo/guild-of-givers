CREATE OR REPLACE FUNCTION public.get_admin_financial_metrics()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  gross_total numeric;
  platform_share numeric;
  ngo_pool_share numeric;
  active_recurring numeric;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Calculate Gross (Success only)
  SELECT COALESCE(SUM(amount_mur), 0) INTO gross_total
  FROM public.payments
  WHERE status = 'success';

  -- Official split calculations
  platform_share := gross_total * 0.20;
  ngo_pool_share := gross_total * 0.80;

  -- Active recurring volume
  SELECT COALESCE(SUM(amount_mur), 0) INTO active_recurring
  FROM public.subscriptions
  WHERE status = 'active';

  result := jsonb_build_object(
    'gross_total', gross_total,
    'platform_share', platform_share,
    'ngo_pool_share', ngo_pool_share,
    'monthly_recurring_forecast', active_recurring
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke execute from public/anon
REVOKE EXECUTE ON FUNCTION public.get_admin_financial_metrics() FROM public, anon;
