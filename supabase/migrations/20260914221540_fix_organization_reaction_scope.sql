DROP POLICY IF EXISTS "Active members and own organization reactions visible" ON public.post_reactions;
CREATE POLICY "Active members and own organization reactions visible" ON public.post_reactions FOR SELECT TO authenticated USING (
  has_role('admin'::app_role) OR has_role('super_admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id=auth.uid() AND s.status='active'::subscription_status)
  OR user_id=auth.uid()
  OR (has_role('organization'::app_role) AND EXISTS (
    SELECT 1 FROM public.community_posts cp JOIN public.initiatives i ON i.id=cp.initiative_id JOIN public.profiles p ON p.organization_id=i.organization_id
    WHERE cp.id=post_reactions.post_id AND p.id=auth.uid()
  ))
);