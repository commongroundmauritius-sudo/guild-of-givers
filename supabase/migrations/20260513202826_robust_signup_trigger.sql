-- Robust handle_new_user trigger that handles profiles, roles, AND initial subscriptions
-- This ensures atomicity and moves business logic to the backend as the source of truth.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_amount DECIMAL;
  fee_cover BOOLEAN;
BEGIN
  -- 1. Initialize Profile
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

  -- 2. Initialize Role (defaulting to member)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 3. Initialize Subscription if metadata is present
  -- subscription_amount comes from the frontend signup flow
  sub_amount := (new.raw_user_meta_data->>'subscription_amount')::NUMERIC;
  fee_cover := COALESCE((new.raw_user_meta_data->>'covers_fees')::BOOLEAN, false);

  IF sub_amount IS NOT NULL AND sub_amount > 0 THEN
    INSERT INTO public.subscriptions (user_id, amount_mur, status, covers_fees)
    VALUES (new.id, sub_amount, 'pending', fee_cover);
  END IF;

  RETURN new;
END;
$$;

-- Re-enable trigger just in case
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
