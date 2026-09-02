-- Allow authors to edit their own posts/comments within 1 hour, and
-- authors or admins to (soft) delete posts and comments at any time.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_posts') THEN
        -- Replace the broad FOR ALL owner policy with explicit, time-boxed rules
        DROP POLICY IF EXISTS "Users can manage own posts" ON public.community_posts;

        DROP POLICY IF EXISTS "Authors can view own posts" ON public.community_posts;
        CREATE POLICY "Authors can view own posts" ON public.community_posts
        FOR SELECT USING (auth.uid() = user_id OR public.has_role('admin'));

        DROP POLICY IF EXISTS "Authors can edit own posts within one hour" ON public.community_posts;
        CREATE POLICY "Authors can edit own posts within one hour" ON public.community_posts
        FOR UPDATE USING (
            public.has_role('admin')
            OR (auth.uid() = user_id AND created_at > (now() - interval '1 hour'))
            -- allow soft delete at any time by the author
            OR auth.uid() = user_id
        )
        WITH CHECK (
            public.has_role('admin')
            OR (auth.uid() = user_id AND created_at > (now() - interval '1 hour'))
            OR (auth.uid() = user_id AND is_deleted = true)
        );

        DROP POLICY IF EXISTS "Authors and admins can delete posts" ON public.community_posts;
        CREATE POLICY "Authors and admins can delete posts" ON public.community_posts
        FOR DELETE USING (auth.uid() = user_id OR public.has_role('admin'));
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_comments') THEN
        DROP POLICY IF EXISTS "Anyone can view comments" ON public.post_comments;
        CREATE POLICY "Anyone can view comments" ON public.post_comments
        FOR SELECT USING (is_deleted = false OR auth.uid() = user_id OR public.has_role('admin'));

        DROP POLICY IF EXISTS "Authenticated users can comment" ON public.post_comments;
        CREATE POLICY "Authenticated users can comment" ON public.post_comments
        FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Authors can edit own comments within one hour" ON public.post_comments;
        CREATE POLICY "Authors can edit own comments within one hour" ON public.post_comments
        FOR UPDATE USING (auth.uid() = user_id OR public.has_role('admin'))
        WITH CHECK (
            public.has_role('admin')
            OR (auth.uid() = user_id AND created_at > (now() - interval '1 hour'))
            OR (auth.uid() = user_id AND is_deleted = true)
        );

        DROP POLICY IF EXISTS "Authors and admins can delete comments" ON public.post_comments;
        CREATE POLICY "Authors and admins can delete comments" ON public.post_comments
        FOR DELETE USING (auth.uid() = user_id OR public.has_role('admin'));
    END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;
GRANT SELECT ON public.community_posts TO anon;
GRANT SELECT ON public.post_comments TO anon;
