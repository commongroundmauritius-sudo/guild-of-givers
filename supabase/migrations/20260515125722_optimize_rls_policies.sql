-- Optimize RLS policies for common queries
-- This includes better Organization visibility and profile access

DO $$
BEGIN
    -- 1. Optimized Organization Visibility
    DROP POLICY IF EXISTS "Public view Organizations" ON public.organizations;
    DROP POLICY IF EXISTS "Public view NGOs" ON public.ngos;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        CREATE POLICY "Optimized public view Organizations" ON public.organizations
        FOR SELECT
        USING (is_verified = true OR status = 'active');
    ELSE
        CREATE POLICY "Optimized public view NGOs" ON public.ngos
        FOR SELECT
        USING (is_verified = true OR status = 'active');
    END IF;

    -- 2. Profiles - Ensure users can always see their own record correctly
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);
END $$;
