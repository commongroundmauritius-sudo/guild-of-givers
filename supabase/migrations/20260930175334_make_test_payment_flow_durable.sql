CREATE OR REPLACE FUNCTION public.create_test_payment(p_user_id uuid, p_amount_mur numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE v_payment_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role IN ('admin','super_admin')) THEN RAISE EXCEPTION 'Unauthorized: admin access required'; END IF;
  IF p_user_id IS NULL OR p_amount_mur <= 0 THEN RAISE EXCEPTION 'Invalid test payment'; END IF;
  INSERT INTO public.payments(user_id,amount_mur,status,currency,is_test,processor_response,reconciliation_status)
  VALUES(p_user_id,p_amount_mur,'pending','MUR',true,jsonb_build_object('simulated',true),'pending')
  RETURNING id INTO v_payment_id;
  RETURN v_payment_id;
END $$;
REVOKE ALL ON FUNCTION public.create_test_payment(uuid,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_test_payment(uuid,numeric) TO authenticated;