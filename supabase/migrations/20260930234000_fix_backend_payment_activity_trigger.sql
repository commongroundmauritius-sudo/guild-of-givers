-- Allow privileged payment-success activity logging without opening
-- payment_completed as a client-created public activity event.
CREATE OR REPLACE FUNCTION public.validate_public_activity_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.event_type IS NULL THEN
    RAISE EXCEPTION 'Invalid public activity event type';
  END IF;

  IF NEW.event_type NOT IN (
    'homepage_view','initiative_view','share_click','lead_captured','campaign_click'
  ) THEN
    IF NEW.event_type <> 'payment_completed'
       OR NEW.source <> 'backend'
       OR COALESCE(current_setting('app.internal_activity_write', true), 'false') <> 'true'
    THEN
      RAISE EXCEPTION 'Invalid public activity event type';
    END IF;
  END IF;

  IF NEW.user_id IS NOT NULL AND NEW.user_id <> (SELECT auth.uid()) THEN
    NEW.user_id := NULL;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_payment_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF (NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status <> 'success')) THEN
    PERFORM set_config('app.internal_activity_write', 'true', true);

    INSERT INTO public.activities (user_id, event_type, source, metadata)
    VALUES (NEW.user_id, 'payment_completed', 'backend', jsonb_build_object(
      'payment_id', NEW.id,
      'amount', NEW.amount_mur,
      'subscription_id', NEW.subscription_id
    ));

    UPDATE public.leads
    SET lead_stage = 'Subscriber',
        last_activity_at = now()
    WHERE email = (SELECT email FROM public.profiles WHERE id = NEW.user_id)
      AND status = 'converted';
  END IF;
  RETURN NEW;
END;
$function$;