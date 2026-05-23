-- Synchronize schema drift to ensure required columns exist for subsequent migrations
DO $$
BEGIN
    -- Ensure organization_id exists on allocations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'allocations' AND column_name = 'organization_id') THEN
        ALTER TABLE public.allocations ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;

    -- Ensure organization_id exists on subscriptions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'organization_id') THEN
        ALTER TABLE public.subscriptions ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;

    -- Ensure organization_id exists on member_preferences
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'member_preferences' AND column_name = 'organization_id') THEN
        ALTER TABLE public.member_preferences ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;

END $$;
