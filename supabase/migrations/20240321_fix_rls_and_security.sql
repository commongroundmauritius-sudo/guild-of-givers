-- Add email to profiles for convenience and sync with trigger
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Add INSERT policies for core tables so users can initialize their own records

-- Profiles: Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User Roles: Allow users to insert their own role
CREATE POLICY "Users can insert their own role"
  ON user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Subscriptions: Allow users to create their own subscriptions
CREATE POLICY "Users can insert their own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Member Preferences: Allow users to insert their own preferences
CREATE POLICY "Users can insert their own preferences"
  ON member_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Initiatives: Allow admins to insert/update
CREATE POLICY "Admins can manage initiatives"
  ON initiatives FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- AUTH TRIGGER FOR AUTOMATIC PROFILE AND ROLE CREATION
-- This ensures the "Backend is the source of truth" (Rule 1)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);

  -- Insert into user_roles (defaulting to member)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'member');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
