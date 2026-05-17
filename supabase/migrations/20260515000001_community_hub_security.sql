-- Community Hub Security & Logic

-- Helper function to check role
CREATE OR REPLACE FUNCTION public.has_role(requested_role public.app_role)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = requested_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Announcements Policies
CREATE POLICY "Public can view non-deleted announcements" ON public.announcements
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Admins can manage announcements" ON public.announcements
    FOR ALL TO authenticated
    USING (public.has_role('admin'))
    WITH CHECK (public.has_role('admin'));

-- 2. Community Posts Policies
CREATE POLICY "Authenticated users can view non-deleted posts" ON public.community_posts
    FOR SELECT TO authenticated
    USING (is_deleted = false);

CREATE POLICY "Members and Admins can create posts" ON public.community_posts
    FOR INSERT TO authenticated
    WITH CHECK (
        (public.has_role('member') OR public.has_role('admin'))
        AND (SELECT auth.uid()) = user_id
    );

CREATE POLICY "Owners and Admins can update their posts" ON public.community_posts
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id OR public.has_role('admin'))
    WITH CHECK ((SELECT auth.uid()) = user_id OR public.has_role('admin'));

-- 3. Comments Policies
CREATE POLICY "Authenticated users can view non-deleted comments" ON public.post_comments
    FOR SELECT TO authenticated
    USING (is_deleted = false);

CREATE POLICY "Qualified users can comment" ON public.post_comments
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = user_id AND (
            public.has_role('admin') OR
            public.has_role('member') OR
            (public.has_role('ngo') AND EXISTS (
                SELECT 1 FROM public.community_posts p
                JOIN public.initiatives i ON p.initiative_id = i.id
                JOIN public.profiles prof ON prof.ngo_id = i.ngo_id
                WHERE p.id = post_id AND prof.id = (SELECT auth.uid())
            ))
        )
    );

CREATE POLICY "Owners and Admins can update their comments" ON public.post_comments
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id OR public.has_role('admin'))
    WITH CHECK ((SELECT auth.uid()) = user_id OR public.has_role('admin'));

-- 4. Reactions Policies
CREATE POLICY "Authenticated users can view reactions" ON public.post_reactions
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Members and Admins can react" ON public.post_reactions
    FOR INSERT TO authenticated
    WITH CHECK (
        (public.has_role('member') OR public.has_role('admin'))
        AND (SELECT auth.uid()) = user_id
    );

CREATE POLICY "Owners can update/delete their reactions" ON public.post_reactions
    FOR ALL TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- 5. Activity Limits and Trust Policies
CREATE POLICY "Users can view their own activity limits" ON public.community_activity_limits
    FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id OR public.has_role('admin'));

CREATE POLICY "Users can view their own trust score" ON public.user_trust
    FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id OR public.has_role('admin'));

-- 6. Notifications Policies
CREATE POLICY "Users can manage their own notifications" ON public.notifications
    FOR ALL TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- 7. Audit Logs Policies
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.has_role('admin'));

-- FUNCTIONS & TRIGGERS

-- Function to handle trust threshold
CREATE OR REPLACE FUNCTION public.handle_post_creation()
RETURNS TRIGGER AS $$
DECLARE
    post_count INTEGER;
BEGIN
    -- Initialize user_trust if not exists
    INSERT INTO public.user_trust (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Get approved post count
    SELECT approved_posts INTO post_count FROM public.user_trust WHERE user_id = NEW.user_id;

    -- Set status based on trust
    IF post_count < 5 AND NOT public.has_role('admin') THEN
        NEW.status := 'pending';
    ELSE
        NEW.status := 'published';
    END IF;

    -- Rate limiting check
    INSERT INTO public.community_activity_limits (user_id, daily_posts, last_post_at)
    VALUES (NEW.user_id, 1, now())
    ON CONFLICT (user_id) DO UPDATE SET
        daily_posts = CASE
            WHEN community_activity_limits.last_post_at < CURRENT_DATE THEN 1
            ELSE community_activity_limits.daily_posts + 1
        END,
        last_post_at = now();

    IF (SELECT daily_posts FROM public.community_activity_limits WHERE user_id = NEW.user_id) > 5 AND NOT public.has_role('admin') THEN
        RAISE EXCEPTION 'Activity limit reached. Try again later.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_handle_post_creation
    BEFORE INSERT ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_post_creation();

-- Function to handle comment count and notifications
CREATE OR REPLACE FUNCTION public.handle_comment_creation()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;

    -- Rate limiting
    INSERT INTO public.community_activity_limits (user_id, hourly_comments, last_comment_at)
    VALUES (NEW.user_id, 1, now())
    ON CONFLICT (user_id) DO UPDATE SET
        hourly_comments = CASE
            WHEN community_activity_limits.last_comment_at < now() - interval '1 hour' THEN 1
            ELSE community_activity_limits.hourly_comments + 1
        END,
        last_comment_at = now();

    IF (SELECT hourly_comments FROM public.community_activity_limits WHERE user_id = NEW.user_id) > 20 AND NOT public.has_role('admin') THEN
        RAISE EXCEPTION 'Activity limit reached. Try again later.';
    END IF;

    -- Notification
    INSERT INTO public.notifications (user_id, type, entity_id)
    SELECT user_id, 'new_comment', NEW.post_id
    FROM public.community_posts
    WHERE id = NEW.post_id AND user_id != NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_handle_comment_creation
    AFTER INSERT ON public.post_comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_comment_creation();

-- Function to handle reaction count and notifications
CREATE OR REPLACE FUNCTION public.handle_reaction_creation()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.community_posts SET reactions_count = reactions_count + 1 WHERE id = NEW.post_id;

    -- Rate limiting
    INSERT INTO public.community_activity_limits (user_id, daily_reactions, last_reaction_at)
    VALUES (NEW.user_id, 1, now())
    ON CONFLICT (user_id) DO UPDATE SET
        daily_reactions = CASE
            WHEN community_activity_limits.last_reaction_at < CURRENT_DATE THEN 1
            ELSE community_activity_limits.daily_reactions + 1
        END,
        last_reaction_at = now();

    IF (SELECT daily_reactions FROM public.community_activity_limits WHERE user_id = NEW.user_id) > 50 AND NOT public.has_role('admin') THEN
        RAISE EXCEPTION 'Activity limit reached. Try again later.';
    END IF;

    -- Notification (bundled logic would be complex in trigger, simple for now)
    INSERT INTO public.notifications (user_id, type, entity_id)
    SELECT user_id, 'new_reaction', NEW.post_id
    FROM public.community_posts
    WHERE id = NEW.post_id AND user_id != NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_handle_reaction_creation
    AFTER INSERT ON public.post_reactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_reaction_creation();

-- Decrement counts on delete
CREATE OR REPLACE FUNCTION public.handle_reaction_deletion()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.community_posts SET reactions_count = reactions_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_handle_reaction_deletion
    AFTER DELETE ON public.post_reactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_reaction_deletion();

-- Audit logging function
CREATE OR REPLACE FUNCTION public.log_community_action()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, previous_data)
        VALUES ((SELECT auth.uid()), TG_OP, TG_TABLE_NAME, OLD.id, row_to_json(OLD));
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, previous_data, new_data)
        VALUES ((SELECT auth.uid()), TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data)
        VALUES ((SELECT auth.uid()), TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_audit_announcements
    AFTER INSERT OR UPDATE OR DELETE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION public.log_community_action();

CREATE TRIGGER tr_audit_posts
    AFTER UPDATE OR DELETE ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION public.log_community_action();

-- Grants
GRANT ALL ON public.announcements TO authenticated, service_role;
GRANT ALL ON public.community_posts TO authenticated, service_role;
GRANT ALL ON public.user_trust TO authenticated, service_role;
GRANT ALL ON public.post_comments TO authenticated, service_role;
GRANT ALL ON public.post_reactions TO authenticated, service_role;
GRANT ALL ON public.community_activity_limits TO authenticated, service_role;
GRANT ALL ON public.notifications TO authenticated, service_role;
GRANT ALL ON public.audit_logs TO authenticated, service_role;

GRANT SELECT ON public.announcements TO anon;
