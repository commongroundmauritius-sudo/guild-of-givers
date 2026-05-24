-- Allocation & Cap Logic refinement

-- Add Impact Pool flag and capacity to initiatives
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS is_impact_pool BOOLEAN DEFAULT false;
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS cap_amount_mur DECIMAL;

-- Add percentage-based distribution to member preferences
ALTER TABLE public.member_preferences ADD COLUMN IF NOT EXISTS distribution_percentage DECIMAL DEFAULT 0;

-- Governance: Status and Suspension
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.ngos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
