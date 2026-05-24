-- Consolidate and harden RLS policies across all tables
-- This migration ensures that every table has a consistent security baseline

DO $$
BEGIN
    -- 1. Profiles
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

    -- 2. Organizations
    DROP POLICY IF EXISTS "Anyone can view verified Organizations" ON public.organizations;
    DROP POLICY IF EXISTS "Anyone can view verified NGOs" ON public.ngos;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        CREATE POLICY "Public view Organizations" ON public.organizations FOR SELECT USING (is_verified = true);
    ELSE
        CREATE POLICY "Public view NGOs" ON public.ngos FOR SELECT USING (is_verified = true);
    END IF;

    -- 3. Initiatives
    DROP POLICY IF EXISTS "Anyone can view initiatives" ON public.initiatives;
    -- Note: Detailed public view is handled in 20260514103920
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view published initiatives' AND tablename = 'initiatives') THEN
        CREATE POLICY "Anyone can view initiatives fallback" ON public.initiatives FOR SELECT USING (true);
    END IF;
END $$;
