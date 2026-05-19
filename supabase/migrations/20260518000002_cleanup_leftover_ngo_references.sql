-- 1. Final verification and cleanup of RLS policies with stale labels or definitions
DO $$
BEGIN
    -- Rename any policies that still mention NGO in initiatives
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'NGO staff can manage own initiatives' AND tablename = 'initiatives') THEN
        ALTER POLICY "NGO staff can manage own initiatives" ON public.initiatives RENAME TO "Organization staff can manage own initiatives";
    END IF;

    -- Rename policies in reports
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'NGO staff can manage their own NGO reports' AND tablename = 'reports') THEN
        ALTER POLICY "NGO staff can manage their own NGO reports" ON public.reports RENAME TO "Organization staff can manage their reports";
    END IF;

    -- Update post_comments policy if it still checks has_role('ngo')
    -- (This was handled in the previous script but we ensure it here too)
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_comments' AND (qual ILIKE '%has_role%''ngo''%' OR with_check ILIKE '%has_role%''ngo''%')) THEN
        DROP POLICY IF EXISTS "Qualified users can comment" ON public.post_comments;
        CREATE POLICY "Qualified users can comment" ON public.post_comments FOR INSERT WITH CHECK (
            ((SELECT auth.uid()) = user_id) AND (
                has_role('admin'::app_role) OR
                has_role('member'::app_role) OR (
                    has_role('organization'::app_role) AND (
                        EXISTS (
                            SELECT 1 FROM community_posts p
                            JOIN initiatives i ON p.initiative_id = i.id
                            JOIN profiles prof ON prof.organization_id = i.organization_id
                            WHERE p.id = post_comments.post_id
                            AND prof.id = (SELECT auth.uid())
                        )
                    )
                )
            )
        );
    END IF;
END $$;

-- 2. Ensure has_role function uses search_path to avoid path hijacking and relation errors
CREATE OR REPLACE FUNCTION public.has_role(requested_role public.app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = requested_role
  );
END;
$function$;

-- 3. Update any triggers that might be missing the new terminology
-- (Checked and triggers like 'check_initiative_status_permissions' use 'has_role')
