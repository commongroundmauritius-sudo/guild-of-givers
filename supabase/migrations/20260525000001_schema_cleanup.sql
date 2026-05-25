-- Schema Cleanup Migration
-- Resolved [P2-006] and [P1-004]

-- 1. Ensure shadow columns are formally documented (if they were missing from local)
-- Note: Based on remote state, these exist. This migration ensures they are part of the version history.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'monthly_target_amount') THEN
        ALTER TABLE public.organizations ADD COLUMN monthly_target_amount NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'impact_metrics') THEN
        ALTER TABLE public.organizations ADD COLUMN impact_metrics TEXT;
    END IF;
END $$;

-- 2. Finalize Ownership Model (P1-009)
-- Remove deprecated owner_user_id after verifying profile-based links
-- COMMENTED OUT: Safety first. Don't drop until P1-009 is verified in Phase 1-D execution.
-- ALTER TABLE public.organizations DROP COLUMN IF EXISTS owner_user_id;
