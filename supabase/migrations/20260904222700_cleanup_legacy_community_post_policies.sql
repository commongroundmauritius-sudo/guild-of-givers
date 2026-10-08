DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_posts') THEN
        DROP POLICY IF EXISTS "Owners and Admins can update their posts" ON public.community_posts;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_comments') THEN
        DROP POLICY IF EXISTS "Owners and Admins can update their comments" ON public.post_comments;
    END IF;
END $$;

