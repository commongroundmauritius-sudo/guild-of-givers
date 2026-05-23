-- 1. Add indices to unindexed foreign keys
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON public.announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_initiative_id ON public.community_posts(initiative_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_comment_id ON public.post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON public.post_reactions(user_id);

-- Explicit foreign key indices for RLS performance
CREATE INDEX IF NOT EXISTS idx_allocations_initiative_id ON public.allocations(initiative_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_organization_id ON public.initiatives(organization_id);

-- 2. Consolidate RLS policies
DROP POLICY IF EXISTS "Initiative access policy" ON public.initiatives;
CREATE POLICY "Initiative access policy" ON public.initiatives
    FOR SELECT USING (
        (is_approved = true AND is_published = true) OR
        has_role('admin'::app_role) OR
        (EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
            AND profiles.organization_id = initiatives.organization_id
        ))
    );

DROP POLICY IF EXISTS "Initiative management policy" ON public.initiatives;
CREATE POLICY "Initiative management policy" ON public.initiatives
    FOR ALL USING (has_role('admin'::app_role))
    WITH CHECK (has_role('admin'::app_role));

DROP POLICY IF EXISTS "Organization staff management policy" ON public.initiatives;
CREATE POLICY "Organization staff management policy" ON public.initiatives
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
            AND profiles.organization_id = initiatives.organization_id
        )
    )
    WITH CHECK (
        EXISTS ( SELECT 1 FROM public.profiles
                 WHERE profiles.id = (SELECT auth.uid())
                 AND profiles.organization_id = initiatives.organization_id
        )
    );

DROP POLICY IF EXISTS "Organization view policy" ON public.organizations;
CREATE POLICY "Organization view policy" ON public.organizations
    FOR SELECT USING (
        (is_verified = true) OR
        (EXISTS (SELECT 1 FROM initiatives i WHERE i.organization_id = organizations.id AND i.is_approved = true AND i.is_published = true)) OR
        (EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
            AND profiles.organization_id = organizations.id
        )) OR
        has_role('admin'::app_role)
    );

DROP POLICY IF EXISTS "Organization management policy" ON public.organizations;
CREATE POLICY "Organization management policy" ON public.organizations
    FOR ALL USING (
        (EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
            AND profiles.organization_id = organizations.id
        )) OR
        has_role('admin'::app_role)
    );
