-- Public partner applications should use a minimal SECURITY DEFINER RPC.
-- Return only the fields the public submission flow needs; never expose
-- administrative/conversion columns from partner_applications.

CREATE OR REPLACE FUNCTION public.submit_partner_application_safe(
  p_org_name text,
  p_org_type text,
  p_reg_num text,
  p_email text,
  p_message text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_application public.partner_applications;
  v_email text := lower(btrim(p_email));
BEGIN
  IF v_email IS NULL OR length(v_email) > 254
     OR v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  THEN RAISE EXCEPTION 'Invalid email address'; END IF;

  IF p_org_name IS NULL OR length(btrim(p_org_name)) NOT BETWEEN 2 AND 200
  THEN RAISE EXCEPTION 'Invalid organization name'; END IF;

  IF p_org_type IS NULL OR length(btrim(p_org_type)) NOT BETWEEN 2 AND 100
  THEN RAISE EXCEPTION 'Invalid organization type'; END IF;

  IF p_reg_num IS NULL OR length(btrim(p_reg_num)) NOT BETWEEN 1 AND 100
  THEN RAISE EXCEPTION 'Invalid registration number'; END IF;

  IF p_message IS NULL OR length(p_message) > 5000
  THEN RAISE EXCEPTION 'Invalid application message'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.partner_applications
    WHERE email = v_email
      AND status IN ('submitted','under_review')
      AND created_at > now() - interval '24 hours'
      AND is_deleted = false
  ) THEN
    RAISE EXCEPTION 'An application from this email is already being processed. Please wait 24 hours before submitting another.';
  END IF;

  INSERT INTO public.partner_applications
    (organization_name,organization_type,registration_number,email,message,status)
  VALUES
    (btrim(p_org_name),btrim(p_org_type),btrim(p_reg_num),v_email,p_message,'submitted')
  RETURNING * INTO v_application;

  INSERT INTO public.partner_application_activity(application_id,action,metadata)
  VALUES (
    v_application.id,
    'submitted',
    jsonb_build_object('message','Application submitted via secure RPC')
  );

  RETURN jsonb_build_object(
    'id',v_application.id,
    'organization_name',v_application.organization_name,
    'organization_type',v_application.organization_type,
    'registration_number',v_application.registration_number,
    'email',v_application.email,
    'message',v_application.message,
    'status',v_application.status,
    'created_at',v_application.created_at
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.submit_partner_application_safe(text,text,text,text,text) FROM public, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_partner_application_safe(text,text,text,text,text) TO anon;

REVOKE EXECUTE ON FUNCTION public.submit_partner_application(text,text,text,text,text) FROM anon;
