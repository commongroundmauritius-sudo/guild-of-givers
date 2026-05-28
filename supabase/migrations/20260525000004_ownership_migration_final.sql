-- Ownership Migration Final
-- Resolved [P1-010] and completes transition to profiles.organization_id

BEGIN;

-- 1. Update Organizations RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
        DROP POLICY IF EXISTS "Organization view policy" ON public.organizations;
        DROP POLICY IF EXISTS "Anyone can view verified organizations" ON public.organizations;
        CREATE POLICY "Anyone can view verified organizations" ON public.organizations
        FOR SELECT USING (is_verified = true OR public.has_role('admin'));

        DROP POLICY IF EXISTS "Organization management policy" ON public.organizations;
        DROP POLICY IF EXISTS "Admins can manage organizations" ON public.organizations;
        CREATE POLICY "Organization staff can manage their organization" ON public.organizations
        FOR ALL USING (
            public.has_role('admin') OR
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.organization_id = organizations.id
                AND profiles.id = auth.uid()
            )
        );
    END IF;
END $$;

-- 2. Update Organization Documents RLS (Guarded)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_documents') THEN
        DROP POLICY IF EXISTS "Owners can manage organization documents" ON public.organization_documents;
        CREATE POLICY "Organization staff can manage their documents" ON public.organization_documents
        FOR ALL USING (
            public.has_role('admin') OR
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.organization_id = organization_documents.organization_id
                AND profiles.id = auth.uid()
            )
        );
    END IF;
END $$;

-- 3. Mark legacy columns as deprecated (Stop new writes - Phase A)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        CREATE OR REPLACE FUNCTION public.check_legacy_ownership_usage()
        RETURNS TRIGGER AS $func$
        BEGIN
            IF NEW.owner_user_id IS NOT NULL THEN
                RAISE WARNING 'Column owner_user_id is deprecated and should not be used. Use profiles.organization_id instead.';
            END IF;
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
        DROP TRIGGER IF EXISTS tr_warn_legacy_ownership ON public.organizations;
        CREATE TRIGGER tr_warn_legacy_ownership
        BEFORE INSERT OR UPDATE OF owner_user_id ON public.organizations
        FOR EACH ROW EXECUTE FUNCTION public.check_legacy_ownership_usage();
    END IF;
END $$;

COMMIT;
