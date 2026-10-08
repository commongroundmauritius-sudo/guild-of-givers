CREATE OR REPLACE FUNCTION public.handle_lead_conversion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leads
  SET status = 'converted', converted_at = COALESCE(converted_at, now()), last_activity_at = now()
  WHERE email = NEW.email AND status = 'started'
    AND (source_initiative_id IS NOT DISTINCT FROM NEW.source_initiative_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_handle_lead_conversion ON public.profiles;
CREATE TRIGGER tr_handle_lead_conversion
AFTER INSERT OR UPDATE OF source_initiative_id ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_lead_conversion();

REVOKE ALL ON FUNCTION public.handle_lead_conversion() FROM PUBLIC;