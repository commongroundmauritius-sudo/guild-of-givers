-- Create missing indices for performance with guards

DO $$
BEGIN
    -- Initiatives
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'initiatives') THEN
        CREATE INDEX IF NOT EXISTS idx_initiatives_organization_id ON public.initiatives(organization_id);
    END IF;

    -- Organization Documents / NGO Documents
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_documents') THEN
        CREATE INDEX IF NOT EXISTS idx_organization_documents_organization_id ON public.organization_documents(organization_id);
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ngo_documents') THEN
        CREATE INDEX IF NOT EXISTS idx_ngo_documents_ngo_id ON public.ngo_documents(ngo_id);
    END IF;

    -- Organizations Owner
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'owner_user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_org_owner ON public.organizations(owner_user_id);
    END IF;

    -- Profiles
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
            CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
        END IF;
    END IF;

    -- Reports
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        CREATE INDEX IF NOT EXISTS idx_reports_organization_id ON public.reports(organization_id);
    END IF;

    -- User Roles
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
    END IF;

    -- Payments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
    END IF;

    -- Allocations
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'allocations') THEN
        CREATE INDEX IF NOT EXISTS idx_allocations_payment_id ON public.allocations(payment_id);
        CREATE INDEX IF NOT EXISTS idx_allocations_initiative_id ON public.allocations(initiative_id);
    END IF;
END $$;
