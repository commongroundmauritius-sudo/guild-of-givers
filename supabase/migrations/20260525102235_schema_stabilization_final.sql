-- Ensure all required columns exist across all environments
DO $$
BEGIN
    -- profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organization_id') THEN
        ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
    END IF;

    -- organizations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'owner_user_id') THEN
        ALTER TABLE public.organizations ADD COLUMN owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'monthly_target_amount') THEN
        ALTER TABLE public.organizations ADD COLUMN monthly_target_amount NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'impact_metrics') THEN
        ALTER TABLE public.organizations ADD COLUMN impact_metrics TEXT;
    END IF;
END $$;

-- Ensure indexes are consistent
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'owner_user_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_org_owner') THEN
            CREATE INDEX idx_org_owner ON public.organizations(owner_user_id);
        END IF;
    END IF;
END $$;
