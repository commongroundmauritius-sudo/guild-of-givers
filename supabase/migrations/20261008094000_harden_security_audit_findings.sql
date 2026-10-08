-- Harden security findings exposed by the production security audit.
-- 1. SECURITY DEFINER functions must use an explicit, locked-down search_path.
CREATE OR REPLACE FUNCTION public.log_org_app_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.organization_application_status_history (application_id, new_status, notes)
    VALUES (NEW.id, NEW.status, 'Initial submission');
  ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.organization_application_status_history (application_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, (SELECT auth.uid()));
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.log_org_app_status_change() FROM PUBLIC, anon, authenticated, service_role;

-- 2. email_queue must not be writable by anonymous clients. Authenticated users may
-- queue only their own transactional email; admins may queue approved templates to
-- an arbitrary recipient for operational workflows.
DROP POLICY IF EXISTS "Anyone can insert into email_queue" ON public.email_queue;
CREATE POLICY "Authenticated can insert safe email_queue entries"
ON public.email_queue
FOR INSERT
TO authenticated
WITH CHECK (
  template_key IN ('welcome', 'payment_confirmation', 'subscription_confirmation', 'initiative_update', 'milestone_reached')
  AND length(btrim(recipient)) BETWEEN 3 AND 254
  AND recipient ~* '^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$'
  AND (
    public.has_role('admin'::public.app_role)
    OR lower(recipient) = lower(COALESCE((SELECT email FROM public.profiles WHERE id = (SELECT auth.uid())), ''))
  )
);

REVOKE INSERT ON public.email_queue FROM anon;
GRANT INSERT ON public.email_queue TO authenticated;
