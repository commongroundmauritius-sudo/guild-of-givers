DROP POLICY IF EXISTS "Authenticated users can view non-deleted posts" ON public.community_posts;
CREATE POLICY "Active members can view community posts" ON public.community_posts FOR SELECT TO authenticated USING (
is_deleted=false AND (has_role('admin'::app_role) OR has_role('super_admin'::app_role) OR EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id=auth.uid() AND s.status='active'::public.subscription_status) OR user_id=auth.uid()));
DROP POLICY IF EXISTS "Anyone can view comments" ON public.post_comments;
DROP POLICY IF EXISTS "Authenticated users can view non-deleted comments" ON public.post_comments;
CREATE POLICY "Active members can view comments" ON public.post_comments FOR SELECT TO authenticated USING (
(is_deleted=false OR user_id=auth.uid() OR has_role('admin'::app_role) OR has_role('super_admin'::app_role)) AND
(has_role('admin'::app_role) OR has_role('super_admin'::app_role) OR EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id=auth.uid() AND s.status='active'::public.subscription_status) OR user_id=auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can view reactions" ON public.post_reactions;
CREATE POLICY "Active members can view reactions" ON public.post_reactions FOR SELECT TO authenticated USING (
has_role('admin'::app_role) OR has_role('super_admin'::app_role) OR EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id=auth.uid() AND s.status='active'::public.subscription_status) OR user_id=auth.uid());
DROP POLICY IF EXISTS "Members and Admins can react" ON public.post_reactions;
CREATE POLICY "Active members can react" ON public.post_reactions FOR INSERT TO authenticated WITH CHECK (
user_id=auth.uid() AND (has_role('admin'::app_role) OR EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id=auth.uid() AND s.status='active'::public.subscription_status)));
DROP POLICY IF EXISTS "Owners can update/delete their reactions" ON public.post_reactions;
CREATE POLICY "Active members can manage own reactions" ON public.post_reactions FOR UPDATE TO authenticated USING (
user_id=auth.uid() AND (has_role('admin'::app_role) OR EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id=auth.uid() AND s.status='active'::public.subscription_status))) WITH CHECK(user_id=auth.uid());
CREATE POLICY "Active members can delete own reactions" ON public.post_reactions FOR DELETE TO authenticated USING (
user_id=auth.uid() AND (has_role('admin'::app_role) OR EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id=auth.uid() AND s.status='active'::public.subscription_status)));
DROP POLICY IF EXISTS "Qualified users can comment" ON public.post_comments;
CREATE POLICY "Active members can comment" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (
user_id=auth.uid() AND (has_role('admin'::app_role) OR EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id=auth.uid() AND s.status='active'::public.subscription_status) OR (has_role('organization'::app_role) AND EXISTS (SELECT 1 FROM public.community_posts cp JOIN public.initiatives i ON i.id=cp.initiative_id JOIN public.profiles p ON p.organization_id=i.organization_id WHERE cp.id=post_comments.post_id AND p.id=auth.uid())));
DROP POLICY IF EXISTS "Authors and admins can delete comments" ON public.post_comments;
CREATE POLICY "Authors admins and active members can delete comments" ON public.post_comments FOR DELETE TO authenticated USING (
(user_id=auth.uid() OR has_role('admin'::app_role) OR has_role('super_admin'::app_role)) AND (has_role('admin'::app_role) OR has_role('super_admin'::app_role) OR EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id=auth.uid() AND s.status='active'::public.subscription_status) OR user_id=auth.uid()));