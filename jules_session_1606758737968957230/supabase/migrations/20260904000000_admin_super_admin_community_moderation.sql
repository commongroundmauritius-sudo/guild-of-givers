-- Update community_posts and post_comments RLS policies to explicitly support admin and super_admin roles for moderation (soft deletion and status updates)

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_posts') THEN
        DROP POLICY IF EXISTS "Authors can view own posts" ON public.community_posts;
        CREATE POLICY "Authors can view own posts" ON public.community_posts
        FOR SELECT USING (auth.uid() = user_id OR public.has_role('admin') OR public.has_role('super_admin'));

        DROP POLICY IF EXISTS "Authors can edit own posts within one hour" ON public.community_posts;
        CREATE POLICY "Authors can edit own posts within one hour" ON public.community_posts
        FOR UPDATE USING (
            auth.uid() = user_id 
            OR public.has_role('admin') 
            OR public.has_role('super_admin')
        )
        WITH CHECK (
            -- Authors can edit their own posts within 1 hour or soft delete their own posts
            (auth.uid() = user_id AND (created_at > (now() - interval '1 hour') OR is_deleted = true))
            -- Admins / Super Admins can soft delete any post or update post moderation status or edit their own posts
            OR (
                (public.has_role('admin') OR public.has_role('super_admin'))
                AND (is_deleted = true OR status IN ('published', 'rejected', 'pending') OR auth.uid() = user_id)
            )
        );

        DROP POLICY IF EXISTS "Authors and admins can delete posts" ON public.community_posts;
        CREATE POLICY "Authors and admins can delete posts" ON public.community_posts
        FOR DELETE USING (auth.uid() = user_id OR public.has_role('admin') OR public.has_role('super_admin'));
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_comments') THEN
        DROP POLICY IF EXISTS "Anyone can view comments" ON public.post_comments;
        CREATE POLICY "Anyone can view comments" ON public.post_comments
        FOR SELECT USING (is_deleted = false OR auth.uid() = user_id OR public.has_role('admin') OR public.has_role('super_admin'));

        DROP POLICY IF EXISTS "Authors can edit own comments within one hour" ON public.post_comments;
        CREATE POLICY "Authors can edit own comments within one hour" ON public.post_comments
        FOR UPDATE USING (
            auth.uid() = user_id 
            OR public.has_role('admin') 
            OR public.has_role('super_admin')
        )
        WITH CHECK (
            (auth.uid() = user_id AND (created_at > (now() - interval '1 hour') OR is_deleted = true))
            OR (
                (public.has_role('admin') OR public.has_role('super_admin'))
                AND (is_deleted = true OR auth.uid() = user_id)
            )
        );

        DROP POLICY IF EXISTS "Authors and admins can delete comments" ON public.post_comments;
        CREATE POLICY "Authors and admins can delete comments" ON public.post_comments
        FOR DELETE USING (auth.uid() = user_id OR public.has_role('admin') OR public.has_role('super_admin'));
    END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;
GRANT SELECT ON public.community_posts TO anon;
GRANT SELECT ON public.post_comments TO anon;
