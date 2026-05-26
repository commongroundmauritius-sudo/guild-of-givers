-- 1. Fix search_path for sensitive functions
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'check_report_status_permissions' AND n.nspname = 'public'
    ) THEN
        ALTER FUNCTION public.check_report_status_permissions() SET search_path = public;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'check_initiative_permissions' AND n.nspname = 'public'
    ) THEN
        ALTER FUNCTION public.check_initiative_permissions() SET search_path = public;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'handle_comment_creation' AND n.nspname = 'public'
    ) THEN
        ALTER FUNCTION public.handle_comment_creation() SET search_path = public;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'handle_new_user' AND n.nspname = 'public'
    ) THEN
        ALTER FUNCTION public.handle_new_user() SET search_path = public;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'handle_post_approval' AND n.nspname = 'public'
    ) THEN
        ALTER FUNCTION public.handle_post_approval() SET search_path = public;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'handle_post_creation' AND n.nspname = 'public'
    ) THEN
        ALTER FUNCTION public.handle_post_creation() SET search_path = public;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'handle_reaction_creation' AND n.nspname = 'public'
    ) THEN
        ALTER FUNCTION public.handle_reaction_creation() SET search_path = public;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'handle_reaction_deletion' AND n.nspname = 'public'
    ) THEN
        ALTER FUNCTION public.handle_reaction_deletion() SET search_path = public;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'has_role' AND n.nspname = 'public'
    ) THEN
        ALTER FUNCTION public.has_role(public.app_role) SET search_path = public;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'log_community_action' AND n.nspname = 'public'
    ) THEN
        ALTER FUNCTION public.log_community_action() SET search_path = public;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'rls_auto_enable' AND n.nspname = 'public'
    ) THEN
        ALTER FUNCTION public.rls_auto_enable() SET search_path = public;
    END IF;
END $$;

-- 2. Revoke public/anon/authenticated execution of SECURITY DEFINER functions (Guarded)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'check_report_status_permissions' AND n.nspname = 'public') THEN
        REVOKE EXECUTE ON FUNCTION public.check_report_status_permissions() FROM PUBLIC, anon, authenticated;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'check_initiative_status_permissions' AND n.nspname = 'public') THEN
        REVOKE EXECUTE ON FUNCTION public.check_initiative_status_permissions() FROM PUBLIC, anon, authenticated;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'handle_comment_creation' AND n.nspname = 'public') THEN
        REVOKE EXECUTE ON FUNCTION public.handle_comment_creation() FROM PUBLIC, anon, authenticated;
    END IF;
END $$;
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'handle_new_user' AND n.nspname = 'public') THEN
        REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'handle_post_approval' AND n.nspname = 'public') THEN
        REVOKE EXECUTE ON FUNCTION public.handle_post_approval() FROM PUBLIC, anon, authenticated;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'handle_post_creation' AND n.nspname = 'public') THEN
        REVOKE EXECUTE ON FUNCTION public.handle_post_creation() FROM PUBLIC, anon, authenticated;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'handle_reaction_creation' AND n.nspname = 'public') THEN
        REVOKE EXECUTE ON FUNCTION public.handle_reaction_creation() FROM PUBLIC, anon, authenticated;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'handle_reaction_deletion' AND n.nspname = 'public') THEN
        REVOKE EXECUTE ON FUNCTION public.handle_reaction_deletion() FROM PUBLIC, anon, authenticated;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'log_community_action' AND n.nspname = 'public') THEN
        REVOKE EXECUTE ON FUNCTION public.log_community_action() FROM PUBLIC, anon, authenticated;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'rls_auto_enable' AND n.nspname = 'public') THEN
        REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
    END IF;
END $$;

-- Keep has_role accessible to authenticated users if needed for RPC, but revoke from anon
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'has_role' AND n.nspname = 'public') THEN
        REVOKE EXECUTE ON FUNCTION public.has_role(public.app_role) FROM PUBLIC, anon;
        GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;
    END IF;
END $$;

-- 3. Optimize RLS performance by using (SELECT auth.uid()) instead of auth.uid() (Guarded)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
        DROP POLICY IF EXISTS "Organization owners can manage their organization" ON public.organizations;
        CREATE POLICY "Organization owners can manage their organization" ON public.organizations
            FOR ALL USING (owner_user_id = (SELECT auth.uid()));
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_documents') THEN
        DROP POLICY IF EXISTS "Owners can manage organization documents" ON public.organization_documents;
        CREATE POLICY "Owners can manage organization documents" ON public.organization_documents
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.organizations
                    WHERE organizations.id = organization_documents.organization_id
                    AND organizations.owner_user_id = (SELECT auth.uid())
                )
            );
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ngo_documents') THEN
        -- Safely handle legacy if it exists
        DROP POLICY IF EXISTS "Owners can manage organization documents" ON public.ngo_documents;
    END IF;
END $$;
