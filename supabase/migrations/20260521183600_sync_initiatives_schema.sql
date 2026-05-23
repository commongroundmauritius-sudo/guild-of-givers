-- Synchronize initiatives schema to include required tracking columns
DO $$
BEGIN
    -- Ensure creator_role exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'creator_role') THEN
        ALTER TABLE public.initiatives ADD COLUMN creator_role public.app_role;
    END IF;

    -- Ensure initiative_source exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'initiative_source') THEN
        ALTER TABLE public.initiatives ADD COLUMN initiative_source TEXT;
    END IF;

    -- Ensure impact_pool_target exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'impact_pool_target') THEN
        ALTER TABLE public.initiatives ADD COLUMN impact_pool_target NUMERIC DEFAULT 0;
    END IF;

END $$;
