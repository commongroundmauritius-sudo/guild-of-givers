-- Performance Optimization and Refinement of RLS Policies
-- Using DO block to safely handle column existence for is_approved/is_published
DO $$
BEGIN
    DROP POLICY IF EXISTS "Anyone can view published initiatives" ON public.initiatives;
    DROP POLICY IF EXISTS "Organization view policy" ON public.organizations;

    -- Update Initiative Public Visibility
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'initiatives' AND column_name = 'is_approved'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'initiatives' AND column_name = 'is_published'
    ) THEN
        CREATE POLICY "Anyone can view published initiatives" ON public.initiatives
        FOR SELECT
        USING (is_approved = true AND is_published = true);
    ELSE
        CREATE POLICY "Anyone can view published initiatives" ON public.initiatives
        FOR SELECT
        USING (true);
    END IF;

    -- Update Organization Public Visibility
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'initiatives' AND column_name = 'is_approved'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'initiatives' AND column_name = 'is_published'
    ) THEN
        CREATE POLICY "Organization view policy" ON public.organizations
        FOR SELECT
        USING (
            is_verified = true OR
            EXISTS (
                SELECT 1 FROM public.initiatives i
                WHERE (i.organization_id = organizations.id OR i.ngo_id = organizations.id)
                AND i.is_approved = true
                AND i.is_published = true
            )
        );
    ELSE
        CREATE POLICY "Organization view policy" ON public.organizations
        FOR SELECT
        USING (is_verified = true);
    END IF;
END $$;

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_initiatives_org_id ON public.initiatives(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_initiatives_ngo_id ON public.initiatives(ngo_id) WHERE ngo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_ngo_id ON public.profiles(ngo_id) WHERE ngo_id IS NOT NULL;
