-- Fix auth signup failures caused by the hardened public activity validator.
-- User-signup activity is a backend-owned event emitted by the auth.users trigger.
-- Keep the validator strict: the trigger marks its insert as internal instead of
-- allowing anonymous clients to forge the event.

CREATE OR REPLACE FUNCTION public.validate_public_activity_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF new.event_type IS NULL THEN
    RAISE EXCEPTION 'Invalid public activity event type';
  END IF;

  IF new.event_type NOT IN (
    'homepage_view',
    'initiative_view',
    'share_click',
    'lead_captured',
    'campaign_click'
  ) THEN
    IF new.event_type NOT IN ('payment_completed', 'user_signup')
       OR new.source <> 'backend'
       OR coalesce(current_setting('app.internal_activity_write', true), 'false') <> 'true'
    THEN
      RAISE EXCEPTION 'Invalid public activity event type';
    END IF;
  END IF;

  IF new.user_id IS NOT NULL AND new.user_id <> (SELECT auth.uid()) THEN
    new.user_id := NULL;
  END IF;

  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_user_signup_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  PERFORM set_config('app.internal_activity_write', 'true', true);

  INSERT INTO public.activities (user_id, event_type, source, metadata)
  VALUES (
    new.id,
    'user_signup',
    'backend',
    jsonb_build_object(
      'email', new.email,
      'full_name', new.raw_user_meta_data->>'full_name'
    )
  );

  RETURN new;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.log_user_signup_activity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_public_activity_insert() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_signup_activity() TO postgres;
GRANT EXECUTE ON FUNCTION public.validate_public_activity_insert() TO postgres;
