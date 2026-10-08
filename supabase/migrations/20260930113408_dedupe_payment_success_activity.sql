CREATE OR REPLACE FUNCTION public.log_payment_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF (NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status <> 'success')) THEN
    INSERT INTO public.activities (user_id, event_type, source, metadata)
    VALUES (NEW.user_id, 'payment_completed', 'backend', jsonb_build_object(
      'payment_id', NEW.id, 'amount', NEW.amount_mur, 'subscription_id', NEW.subscription_id
    ));
    UPDATE public.leads SET lead_stage = 'Subscriber', last_activity_at = now()
    WHERE email = (SELECT email FROM public.profiles WHERE id = NEW.user_id) AND status = 'converted';
  END IF;
  RETURN NEW;
END;
$function$;