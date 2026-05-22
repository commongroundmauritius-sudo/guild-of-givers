-- Update handle_new_user to only create profile, no role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

  -- Role assignment is now deferred until first successful payment
  -- We don't insert into user_roles here anymore.

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to activate membership (assign role)
CREATE OR REPLACE FUNCTION public.activate_membership(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, 'member')
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
