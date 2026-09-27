-- Harden signup role assignment.
-- Client metadata may request only member, or organization through a converted
-- partner application matching the signup email and organization.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  sub_amount DECIMAL;
  fee_cover BOOLEAN;
  requested_role TEXT;
  v_role public.app_role := 'member';
  v_org_id UUID;
  v_partner_valid BOOLEAN := false;
BEGIN
  requested_role := COALESCE(new.raw_user_meta_data->>'role', 'member');
  v_org_id := (new.raw_user_meta_data->>'organization_id')::UUID;

  IF requested_role = 'organization' THEN
    IF v_org_id IS NULL THEN
      RAISE EXCEPTION 'Organization signup requires a verified organization assignment.';
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM public.partner_applications pa
      WHERE pa.converted_organization_id = v_org_id
        AND pa.status = 'converted'
        AND lower(pa.email) = lower(new.email)
    ) INTO v_partner_valid;

    IF NOT v_partner_valid THEN
      RAISE EXCEPTION 'Organization signup is only available through a verified partner invitation.';
    END IF;

    v_role := 'organization';
  ELSIF requested_role <> 'member' THEN
    RAISE EXCEPTION 'Invalid signup role.';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, organization_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    CASE WHEN v_role = 'organization' THEN v_org_id ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    organization_id = EXCLUDED.organization_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF v_role = 'member' THEN
    sub_amount := (new.raw_user_meta_data->>'subscription_amount')::NUMERIC;
    fee_cover := COALESCE((new.raw_user_meta_data->>'covers_fees')::BOOLEAN, false);

    IF sub_amount IS NOT NULL AND sub_amount > 0 THEN
      INSERT INTO public.subscriptions (user_id, amount_mur, status, covers_fees)
      VALUES (new.id, sub_amount, 'pending', fee_cover);
    END IF;
  END IF;

  RETURN new;
END;
$function$;
