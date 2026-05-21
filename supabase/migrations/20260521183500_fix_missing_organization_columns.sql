-- Fix schema drift: Ensure organization_id exists on tables where it's required for indexing/joins
-- These columns were missing from the local migration history but exist in the production database.

DO $$
BEGIN
    -- Ensure organization_id exists in public.allocations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'allocations' AND column_name = 'organization_id') THEN
        ALTER TABLE public.allocations ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
    END IF;

    -- Ensure organization_id exists in public.subscriptions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'organization_id') THEN
        ALTER TABLE public.subscriptions ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
    END IF;

    -- Ensure organization_id exists in public.member_preferences
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'member_preferences' AND column_name = 'organization_id') THEN
        ALTER TABLE public.member_preferences ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
    END IF;
END $$;
