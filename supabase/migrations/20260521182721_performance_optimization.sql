-- Performance Optimization and Refinement of RLS Policies
-- Runs AFTER everything is renamed to Organization

-- 1. Update Initiative Public Visibility
DROP POLICY IF EXISTS "Anyone can view published initiatives" ON public.initiatives;
CREATE POLICY "Anyone can view published initiatives" ON public.initiatives
FOR SELECT
USING (is_approved = true AND is_published = true);

-- 2. Update Organization Public Visibility
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

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_initiatives_org_id ON public.initiatives(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(organization_id) WHERE organization_id IS NOT NULL;
