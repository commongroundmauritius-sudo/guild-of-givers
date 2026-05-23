-- Standardize terminology by renaming NGOs to Organizations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ngos') THEN
        -- Rename the table
        ALTER TABLE public.ngos RENAME TO organizations;

        -- Rename columns if they still use the old prefix
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'name') THEN
            ALTER TABLE public.organizations RENAME COLUMN name TO organization_name;
        END IF;

        -- LEGACY owner_id/owner_user_id handling removed to align with profiles.organization_id model
    END IF;

    -- Rename foreign key columns in other tables
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'ngo_id') THEN
        ALTER TABLE public.initiatives RENAME COLUMN ngo_id TO organization_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'ngo_id') THEN
        ALTER TABLE public.reports RENAME COLUMN ngo_id TO organization_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ngo_id') THEN
        ALTER TABLE public.profiles RENAME COLUMN ngo_id TO organization_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'ngo_id') THEN
        ALTER TABLE public.subscriptions RENAME COLUMN ngo_id TO organization_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'allocations' AND column_name = 'ngo_id') THEN
        ALTER TABLE public.allocations RENAME COLUMN ngo_id TO organization_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'member_preferences' AND column_name = 'ngo_id') THEN
        ALTER TABLE public.member_preferences RENAME COLUMN ngo_id TO organization_id;
    END IF;

    -- Rename the document table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ngo_documents') THEN
        ALTER TABLE public.ngo_documents RENAME TO organization_documents;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_documents' AND column_name = 'ngo_id') THEN
            ALTER TABLE public.organization_documents RENAME COLUMN ngo_id TO organization_id;
        END IF;
    END IF;

    -- Add 'organization' to app_role enum if not present
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'app_role' AND e.enumlabel = 'organization') THEN
        ALTER TYPE public.app_role ADD VALUE 'organization';
    END IF;

END $$;
