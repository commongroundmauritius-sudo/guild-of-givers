-- Enhance handle_new_user to handle the 'organization' role and linking
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_amount DECIMAL;
  fee_cover BOOLEAN;
  v_role TEXT;
  v_org_id UUID;
BEGIN
  -- 1. Extract metadata
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'member');
  v_org_id := (new.raw_user_meta_data->>'organization_id')::UUID;

  -- 2. Initialize Profile
  INSERT INTO public.profiles (id, full_name, email, organization_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    v_org_id
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    organization_id = EXCLUDED.organization_id;

  -- 3. Initialize Role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, v_role::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 4. Initialize Subscription if metadata is present and it's a member
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
$$;
