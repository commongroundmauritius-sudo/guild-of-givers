-- Final production security hardening.
-- Keep public lead capture intentionally available while removing direct public
-- access to partner applications. Harden every SECURITY DEFINER function in
-- the public schema against search_path hijacking.

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', fn.signature);
  END LOOP;
END $$;

-- Partner applications must be submitted through submit_partner_application().
REVOKE INSERT ON public.partner_applications FROM anon, authenticated;
REVOKE SELECT ON public.partner_applications FROM anon;
REVOKE INSERT, SELECT ON public.partner_application_activity FROM anon, authenticated;

GRANT SELECT, UPDATE ON public.partner_applications TO authenticated;
GRANT SELECT ON public.partner_application_activity TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_partner_application(text, text, text, text, text) TO anon, authenticated;
