-- Moderated community posts must not be visible to active members until published.
DROP POLICY IF EXISTS "Active members and own organization posts visible" ON public.community_posts;

CREATE POLICY "Active members and own organization posts visible"
ON public.community_posts
FOR SELECT
TO authenticated
USING (
  is_deleted = false
  AND (
    has_role('admin'::app_role)
    OR has_role('super_admin'::app_role)
    OR user_id = auth.uid()
    OR (
      status = 'published'
      AND EXISTS (
        SELECT 1
        FROM subscriptions s
        WHERE s.user_id = auth.uid()
          AND s.status = 'active'::subscription_status
      )
    )
    OR (
      status = 'published'
      AND has_role('organization'::app_role)
      AND EXISTS (
        SELECT 1
        FROM initiatives i
        JOIN profiles p ON p.organization_id = i.organization_id
        WHERE i.id = community_posts.initiative_id
          AND p.id = auth.uid()
      )
    )
  )
);
