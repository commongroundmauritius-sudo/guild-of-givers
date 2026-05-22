-- Create initiative_versions table
CREATE TABLE IF NOT EXISTS public.initiative_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'superseded')),

    -- Content Fields
    title TEXT,
    description TEXT,
    summary TEXT,
    content TEXT,
    image_url TEXT,
    media_url TEXT,
    category TEXT,

    -- Impact & Goals
    short_term_goals TEXT,
    long_term_goals TEXT,
    target_milestones TEXT,
    expected_outcomes TEXT,
    goal_amount_mur NUMERIC,
    impact_pool_target NUMERIC,

    -- Meta
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    admin_feedback TEXT
);

-- Enable RLS
ALTER TABLE public.initiative_versions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "NGO staff can view own initiative versions" ON public.initiative_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.initiatives i
            JOIN public.profiles p ON p.organization_id = i.organization_id
            WHERE i.id = initiative_versions.initiative_id AND p.id = auth.uid()
        )
    );

CREATE POLICY "NGO staff can create initiative versions" ON public.initiative_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.initiatives i
            JOIN public.profiles p ON p.organization_id = i.organization_id
            WHERE i.id = initiative_id AND p.id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all initiative versions" ON public.initiative_versions
    FOR ALL USING (public.has_role('admin'));

-- Function to promote a version to live
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
    SET title = v_rec.title,
        description = v_rec.description,
        summary = v_rec.summary,
        content = v_rec.content,
        image_url = v_rec.image_url,
        media_url = v_rec.media_url,
        category = v_rec.category,
        short_term_goals = v_rec.short_term_goals,
        long_term_goals = v_rec.long_term_goals,
        target_milestones = v_rec.target_milestones,
        expected_outcomes = v_rec.expected_outcomes,
        goal_amount_mur = v_rec.goal_amount_mur,
        impact_pool_target = v_rec.impact_pool_target,
        is_approved = true,
        updated_at = now()
    WHERE id = v_rec.initiative_id;

    -- 4. Audit Log
    INSERT INTO public.admin_actions (admin_id, action_type, target_id, target_type, details)
    VALUES (p_admin_id, 'approve_initiative_version', v_rec.initiative_id, 'initiative', jsonb_build_object('version_id', p_version_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
