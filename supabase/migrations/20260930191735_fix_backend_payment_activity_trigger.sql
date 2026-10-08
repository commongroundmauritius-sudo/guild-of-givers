CREATE OR REPLACE FUNCTION public.validate_public_activity_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.activity_type = 'payment_completed'
     AND NEW.source = 'backend'
     AND current_setting('app.internal_activity_write', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF NEW.source = 'backend' THEN
    RAISE EXCEPTION 'Backend activity writes must use the internal activity context';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_payment_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.internal_activity_write', 'true', true);

  INSERT INTO public.activity_log (
    user_id,
    activity_type,
    source,
    metadata
  )
  VALUES (
    NEW.user_id,
    'payment_completed',
    'backend',
    jsonb_build_object(
      'payment_id', NEW.id,
      'amount_mur', NEW.amount_mur,
      'status', NEW.status
    )
  );

  UPDATE public.leads
  SET lead_stage = 'Subscriber',
      updated_at = now()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;
