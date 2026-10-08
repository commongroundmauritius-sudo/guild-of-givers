DROP POLICY IF EXISTS "Active members can view community posts" ON public.community_posts;
CREATE POLICY "Active members and own organization posts visible" ON public.community_posts FOR SELECT TO authenticated USING (
  is_deleted = false AND (
    has_role('admin'::app_role) OR has_role('super_admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id=auth.uid() AND s.status='active'::subscription_status)
    OR user_id=auth.uid()
    OR (has_role('organization'::app_role) AND EXISTS (
      SELECT 1 FROM public.initiatives i JOIN public.profiles p ON p.organization_id=i.organization_id
      WHERE i.id=community_posts.initiative_id AND p.id=auth.uid()
    ))
  )
);
DROP POLICY IF EXISTS "Active members can view comments" ON public.post_comments;
CREATE POLICY "Active members and own organization comments visible" ON public.post_comments FOR SELECT TO authenticated USING (
  (is_deleted=false OR user_id=auth.uid() OR has_role('admin'::app_role) OR has_role('super_admin'::app_role)) AND (
    has_role('admin'::app_role) OR has_role('super_admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id=auth.uid() AND s.status='active'::subscription_status)
    OR user_id=auth.uid()
    OR (has_role('organization'::app_role) AND EXISTS (
      SELECT 1 FROM public.community_posts cp JOIN public.initiatives i ON i.id=cp.initiative_id JOIN public.profiles p ON p.organization_id=i.organization_id
      WHERE cp.id=post_comments.post_id AND p.id=auth.uid()
    ))
  )
);