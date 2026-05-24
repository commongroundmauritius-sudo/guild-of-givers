-- Optimize RLS policies for common queries
-- This includes better NGO visibility and profile access

-- 1. Optimized NGO Visibility
DROP POLICY IF EXISTS "Public view NGOs" ON public.ngos;
CREATE POLICY "Optimized public view NGOs" ON public.ngos
FOR SELECT
USING (is_verified = true OR status = 'active');

-- 2. Profiles - Ensure users can always see their own record correctly
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT
USING (auth.uid() = id);
