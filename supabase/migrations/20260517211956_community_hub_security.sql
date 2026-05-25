-- Community Hub Security Hardening

-- Fix community_posts RLS to correctly handle organization role
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_posts') THEN
        DROP POLICY IF EXISTS "Anyone can view published posts" ON public.community_posts;
        CREATE POLICY "Anyone can view published posts" ON public.community_posts
        FOR SELECT USING (status = 'published' AND is_deleted = false);

        DROP POLICY IF EXISTS "Members can create posts" ON public.community_posts;
        CREATE POLICY "Members/Orgs can create posts" ON public.community_posts
        FOR INSERT WITH CHECK (
            auth.uid() = user_id AND
            (public.has_role('member') OR public.has_role('organization'))
        );

        DROP POLICY IF EXISTS "Users can manage own posts" ON public.community_posts;
        CREATE POLICY "Users can manage own posts" ON public.community_posts
        FOR ALL USING (auth.uid() = user_id OR public.has_role('admin'));

    END IF;
END $$;
-- Ensure organization staff can moderate posts for their own initiatives
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_posts') THEN
        DROP POLICY IF EXISTS "Organization staff can moderate own initiative posts" ON public.community_posts;
        CREATE POLICY "Organization staff can moderate own initiative posts" ON public.community_posts
        FOR ALL USING (
            public.has_role('organization') AND EXISTS (
                SELECT 1 FROM public.initiatives i
                JOIN public.profiles prof ON prof.organization_id = i.organization_id
                WHERE i.id = community_posts.initiative_id
                AND prof.id = auth.uid()
            )
        );

    END IF;
END $$;
-- RLS for user_trust (Admin only)
ALTER TABLE public.user_trust ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_trust') THEN
        DROP POLICY IF EXISTS "Admins can manage user trust" ON public.user_trust;
        CREATE POLICY "Admins can manage user trust" ON public.user_trust
        FOR ALL USING (public.has_role('admin'));

        CREATE POLICY "Users can view own trust" ON public.user_trust
        FOR SELECT USING (auth.uid() = user_id);

    END IF;
END $$;
-- RLS for activity limits
ALTER TABLE public.community_activity_limits ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_activity_limits') THEN
        DROP POLICY IF EXISTS "Admins can manage limits" ON public.community_activity_limits;
        CREATE POLICY "Admins can manage limits" ON public.community_activity_limits
        FOR ALL USING (public.has_role('admin'));

        DROP POLICY IF EXISTS "Users can view own limits" ON public.community_activity_limits;
        CREATE POLICY "Users can view own limits" ON public.community_activity_limits
        FOR SELECT USING (auth.uid() = user_id);

    END IF;
END $$;