-- 1. Data Migration
-- Safely migrate roles if 'ngo' exists in the enum
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'app_role' AND e.enumlabel = 'ngo'
    ) THEN
        UPDATE public.user_roles SET role = 'organization' WHERE role = 'ngo';
        UPDATE public.initiatives SET creator_role = 'organization' WHERE creator_role = 'ngo';
    END IF;
END $$;

-- 2. Policy Normalization
DROP POLICY IF EXISTS "Qualified users can comment" ON public.post_comments;
CREATE POLICY "Qualified users can comment" ON public.post_comments
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = user_id AND (
            has_role('admin'::app_role) OR
            has_role('member'::app_role) OR
            (has_role('organization'::app_role) AND (EXISTS (
                SELECT 1 FROM public.community_posts p
                JOIN public.initiatives i ON p.initiative_id = i.id
                JOIN public.profiles prof ON prof.organization_id = i.organization_id
                WHERE p.id = post_comments.post_id AND prof.id = (SELECT auth.uid())
            )))
        )
    );
