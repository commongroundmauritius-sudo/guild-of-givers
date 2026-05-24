-- Final cleanup of any lingering NGO references in RLS or logic

BEGIN;

-- 1. Standards for initiative_versions
DROP POLICY IF EXISTS "NGO staff can view own initiative versions" ON public.initiative_versions;
DROP POLICY IF EXISTS "Organization staff can view own initiative versions" ON public.initiative_versions;
CREATE POLICY "Organization staff can view own initiative versions" ON public.initiative_versions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.initiatives i
        JOIN public.profiles p ON p.organization_id = i.organization_id
        WHERE i.id = initiative_versions.initiative_id AND p.id = auth.uid()
    )
);

DROP POLICY IF EXISTS "NGO staff can create initiative versions" ON public.initiative_versions;
DROP POLICY IF EXISTS "Organization staff can create initiative versions" ON public.initiative_versions;
CREATE POLICY "Organization staff can create initiative versions" ON public.initiative_versions
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.initiatives i
        JOIN public.profiles p ON p.organization_id = i.organization_id
        WHERE i.id = initiative_versions.initiative_id AND p.id = auth.uid()
    )
);

-- 2. Standardize organization table policies
DROP POLICY IF EXISTS "Organization view policy" ON public.organizations;
CREATE POLICY "Anyone can view verified organizations" ON public.organizations
FOR SELECT USING (is_verified = true OR public.has_role('admin'));

DROP POLICY IF EXISTS "Organization management policy" ON public.organizations;
CREATE POLICY "Admins can manage organizations" ON public.organizations
FOR ALL USING (public.has_role('admin'));

-- 3. Standardize organization documents
DROP POLICY IF EXISTS "Owners can manage organization documents" ON public.organization_documents;
CREATE POLICY "Organization staff can manage their documents" ON public.organization_documents
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE organization_id = organization_documents.organization_id AND id = auth.uid()
    )
);

-- 4. Final Terminology Alignment
-- Update any remaining comments or metadata that might confuse the system
COMMENT ON TABLE public.organizations IS 'Authoritative table for registered organizations (formerly NGOs)';

COMMIT;
