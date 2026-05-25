-- Performance Optimization and Refinement of RLS Policies
-- Runs AFTER everything is renamed to Organization

-- 1. Update Initiative Public Visibility (Guarded)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'initiatives') THEN
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'initiatives') THEN
                DROP POLICY IF EXISTS "Anyone can view published initiatives" ON public.initiatives;
                CREATE POLICY "Anyone can view published initiatives" ON public.initiatives
                FOR SELECT
                USING (is_approved = true AND is_published = true);
    END IF;
END $$;
    END IF;
END $$;

-- 2. Update Organization Public Visibility (Guarded)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
                DROP POLICY IF EXISTS "Public view policy" ON public.organizations;
                CREATE POLICY "Organization view policy" ON public.organizations
                FOR SELECT
                USING (
                    is_verified = true OR
                    EXISTS (
                        SELECT 1 FROM public.initiatives i
                        WHERE i.organization_id = organizations.id
                        AND i.is_approved = true
                        AND i.is_published = true
                    )
                );
    END IF;
END $$;
    END IF;
END $$;

-- Indices for performance
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'initiatives') THEN
        CREATE INDEX IF NOT EXISTS idx_initiatives_org_id ON public.initiatives(organization_id) WHERE organization_id IS NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(organization_id) WHERE organization_id IS NOT NULL;
    END IF;
END $$;
