-- Allocation & Cap Logic refinement

-- Add Impact Pool flag and capacity to initiatives
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS is_impact_pool BOOLEAN DEFAULT false;
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS cap_amount_mur DECIMAL;

-- Add percentage-based distribution to member preferences
ALTER TABLE public.member_preferences ADD COLUMN IF NOT EXISTS distribution_percentage DECIMAL DEFAULT 0;

-- Governance: Status and Suspension
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
        ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ngos') THEN
        ALTER TABLE public.ngos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
    END IF;
END $$;
