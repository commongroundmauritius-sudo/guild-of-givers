-- 1. Clean up legacy functions
DROP FUNCTION IF EXISTS public.handle_new_auth_user();

-- 2. Resolve orphaned users (users created before the trigger was finalized)
-- Specifically for the primary admin user identified in diagnostics
INSERT INTO public.profiles (id, full_name, email)
SELECT id, 'CommonGround Admin', email
FROM auth.users
WHERE id = '3f4fec9b-c70c-4617-83e4-50adf822cd02'
ON CONFLICT (id) DO NOTHING;

-- 3. Ensure the current trigger is robust (Final confirmation)
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

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
