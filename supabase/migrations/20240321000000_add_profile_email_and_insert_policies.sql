-- Add email to profiles for convenience and sync with trigger
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Add INSERT policies for core tables so users can initialize their own records
-- Using idempotent blocks to prevent blocking migrations

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profile') THEN
        CREATE POLICY "Users can insert their own profile"
          ON profiles FOR INSERT
          WITH CHECK (auth.uid() = id);
    END IF;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own role') THEN
        CREATE POLICY "Users can insert their own role"
          ON user_roles FOR INSERT
          WITH CHECK (auth.uid() = user_id);
    END IF;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own subscriptions') THEN
        CREATE POLICY "Users can insert their own subscriptions"
          ON subscriptions FOR INSERT
          WITH CHECK (auth.uid() = user_id);
    END IF;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage initiatives') THEN
        CREATE POLICY "Admins can manage initiatives"
          ON initiatives FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM user_roles
              WHERE user_id = auth.uid() AND role = 'admin'
            )
          );
    END IF;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AUTH TRIGGER FOR AUTOMATIC PROFILE AND ROLE CREATION
-- This ensures the "Backend is the source of truth" (Rule 1)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email)
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

  -- Insert into user_roles (defaulting to member)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
