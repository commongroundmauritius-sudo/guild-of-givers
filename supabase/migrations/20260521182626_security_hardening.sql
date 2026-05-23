-- 1. Fix search_path for sensitive functions
ALTER FUNCTION public.check_report_status_permissions() SET search_path = public;
ALTER FUNCTION public.check_initiative_status_permissions() SET search_path = public;
ALTER FUNCTION public.handle_comment_creation() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_post_approval() SET search_path = public;
ALTER FUNCTION public.handle_post_creation() SET search_path = public;
ALTER FUNCTION public.handle_reaction_creation() SET search_path = public;
ALTER FUNCTION public.handle_reaction_deletion() SET search_path = public;
ALTER FUNCTION public.has_role(public.app_role) SET search_path = public;
ALTER FUNCTION public.log_community_action() SET search_path = public;
ALTER FUNCTION public.rls_auto_enable() SET search_path = public;

-- 2. Revoke public/anon/authenticated execution of SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.check_report_status_permissions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_initiative_status_permissions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_comment_creation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_post_approval() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_post_creation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_reaction_creation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_reaction_deletion() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_community_action() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- Keep has_role accessible to authenticated users if needed for RPC, but revoke from anon
REVOKE EXECUTE ON FUNCTION public.has_role(public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;

-- 3. Optimize RLS performance by using (SELECT auth.uid()) instead of auth.uid()
DROP POLICY IF EXISTS "Organization owners can manage their organization" ON public.organizations;
CREATE POLICY "Organization owners can manage their organization" ON public.organizations
    FOR ALL USING (owner_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Owners can manage organization documents" ON public.organization_documents;
CREATE POLICY "Owners can manage organization documents" ON public.organization_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organizations
            WHERE organizations.id = organization_documents.organization_id
            AND organizations.owner_user_id = (SELECT auth.uid())
        )
    );
