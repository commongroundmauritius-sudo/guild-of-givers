-- Lead Lifecycle Automation: Conversion and Abandonment
-- This addresses Phase 7 requirements

-- 1. Function to handle lead conversion
CREATE OR REPLACE FUNCTION public.handle_lead_conversion()
RETURNS TRIGGER AS $$
BEGIN
    -- When a profile is linked to an initiative, update the corresponding lead if it exists
    IF (NEW.source_initiative_id IS NOT NULL) THEN
        UPDATE public.leads
        SET
            status = 'converted',
            converted_at = now(),
            last_activity_at = now()
        WHERE email = NEW.email
        AND source_initiative_id = NEW.source_initiative_id
        AND status = 'started';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_handle_lead_conversion ON public.profiles;
CREATE TRIGGER tr_handle_lead_conversion
AFTER UPDATE OF source_initiative_id ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_lead_conversion();

-- 2. Function to handle lead inactivation (supporter cancelled)
CREATE OR REPLACE FUNCTION public.handle_lead_inactivation()
RETURNS TRIGGER AS $$
DECLARE
    v_email TEXT;
    v_source_init_id UUID;
BEGIN
    -- Only act on transition to cancelled/past_due
    IF (NEW.status IN ('cancelled', 'past_due')) THEN
        -- Get user email and source initiative
        SELECT email, source_initiative_id INTO v_email, v_source_init_id
        FROM public.profiles
        WHERE id = NEW.user_id;

        UPDATE public.leads
        SET
            status = 'inactive',
            last_activity_at = now()
        WHERE email = v_email
        AND source_initiative_id = v_source_init_id
        AND status = 'converted';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_handle_lead_inactivation ON public.subscriptions;
CREATE TRIGGER tr_handle_lead_inactivation
AFTER UPDATE OF status ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.handle_lead_inactivation();

-- 3. Procedure for marking abandoned leads (can be called by a cron/worker)
CREATE OR REPLACE FUNCTION public.mark_abandoned_leads(p_timeout_hours INTEGER DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.leads
    SET
        status = 'abandoned',
        last_activity_at = now()
    WHERE status = 'started'
    AND last_activity_at < (now() - (p_timeout_hours || ' hours')::interval);

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
