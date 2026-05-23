-- Add post approval tracking for trust system
CREATE OR REPLACE FUNCTION public.handle_post_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status = 'pending' OR OLD.status = 'rejected') AND NEW.status = 'published' THEN
        UPDATE public.user_trust
        SET approved_posts = approved_posts + 1
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_handle_post_approval ON public.community_posts;
CREATE TRIGGER tr_handle_post_approval
    AFTER UPDATE ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_post_approval();
