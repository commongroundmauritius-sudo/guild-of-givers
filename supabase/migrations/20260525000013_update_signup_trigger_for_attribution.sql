-- Update handle_new_user to handle source_initiative_id and primary_initiative_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_amount DECIMAL;
  fee_cover BOOLEAN;
  source_init_id UUID;
BEGIN
  -- Extract attribution metadata
  source_init_id := (new.raw_user_meta_data->>'source_initiative_id')::UUID;

  -- 1. Initialize Profile with attribution
  INSERT INTO public.profiles (id, full_name, email, source_initiative_id, primary_initiative_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    source_init_id,
    source_init_id -- Initially, primary is same as source
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    source_initiative_id = COALESCE(profiles.source_initiative_id, EXCLUDED.source_initiative_id),
    primary_initiative_id = COALESCE(profiles.primary_initiative_id, EXCLUDED.primary_initiative_id);

  -- 2. Initialize Role (defaulting to member)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 3. Initialize Subscription if metadata is present
  sub_amount := (new.raw_user_meta_data->>'subscription_amount')::NUMERIC;
  fee_cover := COALESCE((new.raw_user_meta_data->>'covers_fees')::BOOLEAN, false);

  IF sub_amount IS NOT NULL AND sub_amount > 0 THEN
    INSERT INTO public.subscriptions (user_id, amount_mur, status, covers_fees)
    VALUES (new.id, sub_amount, 'pending', fee_cover);
  END IF;

  -- 4. Automatically set member preference if source_initiative_id exists
  IF source_init_id IS NOT NULL THEN
    INSERT INTO public.member_preferences (user_id, initiative_id, priority_level)
    VALUES (new.id, source_init_id, 1)
    ON CONFLICT (user_id, initiative_id) DO NOTHING;

    -- Record registration conversion event if possible (though we'll do it from frontend for session_id)
  END IF;

  RETURN new;
END;
$$;
