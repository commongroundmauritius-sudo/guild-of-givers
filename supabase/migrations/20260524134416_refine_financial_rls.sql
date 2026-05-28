-- Final cleanup of any lingering Organization references in RLS or logic

BEGIN;

-- 1. Standards for initiative_versions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'initiative_versions') THEN
        DROP POLICY IF EXISTS "Organization staff can view own initiative versions" ON public.initiative_versions;
        CREATE POLICY "Organization staff can view own initiative versions" ON public.initiative_versions
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.initiatives i
                JOIN public.profiles p ON p.organization_id = i.organization_id
                WHERE i.id = initiative_versions.initiative_id AND p.id = auth.uid()
            )
        );

        DROP POLICY IF EXISTS "Organization staff can create initiative versions" ON public.initiative_versions;
        CREATE POLICY "Organization staff can create initiative versions" ON public.initiative_versions
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.initiatives i
                JOIN public.profiles p ON p.organization_id = i.organization_id
                WHERE i.id = initiative_versions.initiative_id AND p.id = auth.uid()
            )
        );
    END IF;
END $$;

-- 2. Standardize organization table policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
        DROP POLICY IF EXISTS "Organization view policy" ON public.organizations;
        DROP POLICY IF EXISTS "Anyone can view verified organizations" ON public.organizations;
        CREATE POLICY "Anyone can view verified organizations" ON public.organizations
        FOR SELECT USING (is_verified = true OR public.has_role('admin'));

        DROP POLICY IF EXISTS "Organization management policy" ON public.organizations;
        DROP POLICY IF EXISTS "Admins can manage organizations" ON public.organizations;
        CREATE POLICY "Admins can manage organizations" ON public.organizations
        FOR ALL USING (public.has_role('admin'));
    END IF;
END $$;

-- 3. Standardize organization documents (Guarded)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_documents') THEN
        DROP POLICY IF EXISTS "Owners can manage organization documents" ON public.organization_documents;
        CREATE POLICY "Organization staff can manage their documents" ON public.organization_documents
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE organization_id = organization_documents.organization_id AND id = auth.uid()
            )
        );
    END IF;
END $$;

-- 4. Final Terminology Alignment
-- Update any remaining comments or metadata that might confuse the system
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
        COMMENT ON TABLE public.organizations IS 'Authoritative table for registered organizations';
    END IF;
END $$;

COMMIT;
