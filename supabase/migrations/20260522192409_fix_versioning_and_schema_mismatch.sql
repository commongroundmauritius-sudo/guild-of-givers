-- Add missing updated_at to initiatives if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'updated_at') THEN
        ALTER TABLE public.initiatives ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- Patch approve_initiative_version to handle potential missing columns in rec
CREATE OR REPLACE FUNCTION public.approve_initiative_version(p_version_id UUID, p_admin_id UUID)
RETURNS VOID AS $$
DECLARE
    v_rec RECORD;
BEGIN
    SELECT * INTO v_rec FROM public.initiative_versions WHERE id = p_version_id;

    IF v_rec.status != 'pending' THEN
        RAISE EXCEPTION 'Only pending versions can be approved';
    END IF;

    -- 1. Mark existing approved versions as superseded
    UPDATE public.initiative_versions
    SET status = 'superseded'
    WHERE initiative_id = v_rec.initiative_id AND status = 'approved';

    -- 2. Update version status
    UPDATE public.initiative_versions
    SET status = 'approved',
        reviewed_at = now(),
        reviewed_by = p_admin_id
    WHERE id = p_version_id;

    -- 3. Update main initiative record
    UPDATE public.initiatives
    SET title = COALESCE(v_rec.title, title),
        description = COALESCE(v_rec.description, description),
        summary = COALESCE(v_rec.summary, summary),
        content = COALESCE(v_rec.content, content),
        image_url = COALESCE(v_rec.image_url, image_url),
        media_url = COALESCE(v_rec.media_url, media_url),
        category = COALESCE(v_rec.category, category),
        short_term_goals = COALESCE(v_rec.short_term_goals, short_term_goals),
        long_term_goals = COALESCE(v_rec.long_term_goals, long_term_goals),
        target_milestones = COALESCE(v_rec.target_milestones, target_milestones),
        expected_outcomes = COALESCE(v_rec.expected_outcomes, expected_outcomes),
        goal_amount_mur = COALESCE(v_rec.goal_amount_mur, goal_amount_mur),
        impact_pool_target = COALESCE(v_rec.impact_pool_target, impact_pool_target),
        is_approved = true,
        updated_at = now()
    WHERE id = v_rec.initiative_id;

    -- 4. Audit Log
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_actions') THEN
        INSERT INTO public.admin_actions (admin_id, action_type, target_id, target_type, details)
        VALUES (p_admin_id, 'approve_initiative_version', v_rec.initiative_id, 'initiative', jsonb_build_object('version_id', p_version_id));
    ELSE
        INSERT INTO public.audit_logs (action, entity_type, entity_id, details)
        VALUES ('approve_initiative_version', 'initiative', v_rec.initiative_id, jsonb_build_object('version_id', p_version_id, 'admin_id', p_admin_id));
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
