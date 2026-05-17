DO $$
DECLARE
    u_id UUID;
    p_id UUID;
BEGIN
    SELECT id INTO u_id FROM public.profiles LIMIT 1;

    FOR i IN 1..100 LOOP
        INSERT INTO public.community_posts (id, user_id, title, content, status)
        VALUES (gen_random_uuid(), u_id, 'Performance Post ' || i, 'Content for performance testing post ' || i, 'published')
        RETURNING id INTO p_id;

        INSERT INTO public.post_comments (post_id, user_id, content)
        SELECT p_id, u_id, 'Comment ' || j FROM generate_series(1, 5) j;

        INSERT INTO public.post_reactions (post_id, user_id, reaction_type)
        VALUES (p_id, u_id, 'Support');
    END LOOP;
END $$;
