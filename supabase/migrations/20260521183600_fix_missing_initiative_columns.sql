-- Fix major schema drift for the initiatives table
-- Several columns exist in production but are missing from local migrations.

DO $$
BEGIN
    -- Add creator information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'creator_user_id') THEN
        ALTER TABLE public.initiatives ADD COLUMN creator_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'creator_role') THEN
        ALTER TABLE public.initiatives ADD COLUMN creator_role public.app_role;
    END IF;

    -- Add source tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'initiative_source') THEN
        ALTER TABLE public.initiatives ADD COLUMN initiative_source TEXT DEFAULT 'organization_submission';
        ALTER TABLE public.initiatives ADD CONSTRAINT initiatives_initiative_source_check
            CHECK (initiative_source = ANY (ARRAY['organization_submission'::text, 'admin_created'::text]));
    END IF;

    -- Add category
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'category') THEN
        ALTER TABLE public.initiatives ADD COLUMN category TEXT;
    END IF;

    -- Add Impact Pool metrics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'impact_pool_target') THEN
        ALTER TABLE public.initiatives ADD COLUMN impact_pool_target NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'impact_pool_current') THEN
        ALTER TABLE public.initiatives ADD COLUMN impact_pool_current NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'impact_pool_allocation') THEN
        ALTER TABLE public.initiatives ADD COLUMN impact_pool_allocation NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'impact_pool_progress') THEN
        ALTER TABLE public.initiatives ADD COLUMN impact_pool_progress NUMERIC DEFAULT 0;
    END IF;

    -- Add goals and outcomes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'short_term_goals') THEN
        ALTER TABLE public.initiatives ADD COLUMN short_term_goals TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'long_term_goals') THEN
        ALTER TABLE public.initiatives ADD COLUMN long_term_goals TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'target_milestones') THEN
        ALTER TABLE public.initiatives ADD COLUMN target_milestones TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'expected_outcomes') THEN
        ALTER TABLE public.initiatives ADD COLUMN expected_outcomes TEXT;
    END IF;

END $$;
