-- Add unique constraint for bundling notifications
ALTER TABLE public.notifications ADD CONSTRAINT unique_unread_notification UNIQUE (user_id, type, entity_id);

-- Update reaction trigger for bundling
CREATE OR REPLACE FUNCTION public.handle_reaction_creation()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.community_posts SET reactions_count = reactions_count + 1 WHERE id = NEW.post_id;

    -- Rate limiting check
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

    -- Notification (bundled)
    INSERT INTO public.notifications (user_id, type, entity_id, bundle_count)
    SELECT user_id, 'new_reaction', NEW.post_id, 1
    FROM public.community_posts
    WHERE id = NEW.post_id AND user_id != NEW.user_id
    ON CONFLICT ON CONSTRAINT unique_unread_notification
    DO UPDATE SET
        bundle_count = notifications.bundle_count + 1,
        created_at = now(),
        read = false;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
