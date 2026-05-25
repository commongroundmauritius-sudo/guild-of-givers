-- Priority Ranking Hardening
-- Resolves [P2-009]

BEGIN;

-- 1. Enforce unique priority levels per user
ALTER TABLE public.member_preferences
DROP CONSTRAINT IF EXISTS unique_user_priority;

ALTER TABLE public.member_preferences
ADD CONSTRAINT unique_user_priority UNIQUE (user_id, priority_level);

-- 2. Prevent Impact Pool from being assigned as a numbered priority
CREATE OR REPLACE FUNCTION public.check_preference_validity()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.initiatives
        WHERE id = NEW.initiative_id AND is_impact_pool = true
    ) THEN
        RAISE EXCEPTION 'Impact Pool cannot be manually assigned as a priority level.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_preference_validity ON public.member_preferences;
CREATE TRIGGER tr_check_preference_validity
BEFORE INSERT OR UPDATE ON public.member_preferences
FOR EACH ROW EXECUTE FUNCTION public.check_preference_validity();

COMMIT;
