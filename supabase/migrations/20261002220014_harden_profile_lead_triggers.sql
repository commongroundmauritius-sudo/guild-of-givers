CREATE OR REPLACE FUNCTION public.handle_lead_conversion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.leads
  SET status='converted', converted_at=COALESCE(converted_at, now()), last_activity_at=now(), lead_stage='Subscriber'
  WHERE lower(email)=lower(NEW.email)
    AND status IN ('started','converted')
    AND source_initiative_id IS NOT DISTINCT FROM NEW.source_initiative_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_lead_stage_on_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.leads
  SET lead_stage = 'Registered User', last_activity_at = now()
  WHERE email = NEW.email
    AND lead_stage = 'Visitor';
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.handle_lead_conversion() FROM public, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.update_lead_stage_on_registration() FROM public, anon, authenticated, service_role;
