CREATE OR REPLACE FUNCTION public.track_lead_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF (OLD.status IS NULL OR OLD.status <> NEW.status) THEN
    INSERT INTO public.lead_status_history (lead_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, (SELECT auth.uid()));
  END IF;
  NEW.last_activity_at = now();
  RETURN NEW;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.track_lead_status_change() FROM public, anon, authenticated, service_role;
