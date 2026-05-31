-- Secure Partner Application Submission RPC
-- This migration implements a SECURITY DEFINER function to handle partner applications,
-- allowing us to revoke public INSERT/SELECT access from the tables.

DO $$
BEGIN
    -- 1. Create the RPC function
    CREATE OR REPLACE FUNCTION public.submit_partner_application(
      p_org_name text,
      p_org_type text,
      p_reg_num text,
      p_email text,
      p_message text
    )
    RETURNS public.partner_applications
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $body$
    DECLARE
      v_application public.partner_applications;
      v_cooldown_expiry timestamptz;
    BEGIN
      -- Normalize email
      p_email := trim(lower(p_email));
      v_cooldown_expiry := now() - interval '24 hours';

      -- 1. Duplicate protection (24h cooldown for pending/submitted status)
      IF EXISTS (
        SELECT 1 FROM public.partner_applications
        WHERE email = p_email
        AND status IN ('submitted', 'under_review')
        AND created_at > v_cooldown_expiry
        AND is_deleted = false
      ) THEN
        RAISE EXCEPTION 'An application from this email is already being processed. Please wait 24 hours before submitting another.';
      END IF;

      -- 2. Insert application
      INSERT INTO public.partner_applications (
        organization_name,
        organization_type,
        registration_number,
        email,
        message,
        status
      )
      VALUES (
        p_org_name,
        p_org_type,
        p_reg_num,
        p_email,
        p_message,
        'submitted'
      )
      RETURNING * INTO v_application;

      -- 3. Log activity
      INSERT INTO public.partner_application_activity (
        application_id,
        action,
        metadata
      )
      VALUES (
        v_application.id,
        'submitted',
        jsonb_build_object('message', 'Application submitted via secure RPC')
      );

      RETURN v_application;
    END;
    $body$;

    -- 2. Revoke public access to the tables to harden security
    -- We revoke INSERT and SELECT from anon and authenticated, forcing them to use the RPC.
    REVOKE INSERT, SELECT ON public.partner_applications FROM anon, authenticated;
    REVOKE INSERT, SELECT ON public.partner_application_activity FROM anon, authenticated;

    -- 3. Grant execute privilege on the RPC
    GRANT EXECUTE ON FUNCTION public.submit_partner_application(text, text, text, text, text) TO anon, authenticated;

END $$;
