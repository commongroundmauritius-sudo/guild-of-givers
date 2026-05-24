DO $$
BEGIN
    -- 1. Extend profiles with age constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_age_check') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_age_check CHECK (age >= 13 AND age <= 120);
    END IF;

    -- 2. Rename ngos table to organizations
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ngos') THEN
        ALTER TABLE public.ngos RENAME TO organizations;
    END IF;

    -- 3. Update organizations table columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'owner_id') THEN
        ALTER TABLE public.organizations RENAME COLUMN owner_id TO owner_user_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'name') THEN
        ALTER TABLE public.organizations RENAME COLUMN name TO organization_name;
    END IF;

    -- 4. Add new fields to organizations
    ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS address text,
    ADD COLUMN IF NOT EXISTS contact_email text,
    ADD COLUMN IF NOT EXISTS contact_phone text,
    ADD COLUMN IF NOT EXISTS milestones text,
    ADD COLUMN IF NOT EXISTS expected_outcomes text,
    ADD COLUMN IF NOT EXISTS allocation_summary text;

    -- 5. Rename ngo_id to organization_id in all referencing tables
    -- profiles
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ngo_id') THEN
        ALTER TABLE public.profiles RENAME COLUMN ngo_id TO organization_id;
    END IF;
    -- initiatives
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'ngo_id') THEN
        ALTER TABLE public.initiatives RENAME COLUMN ngo_id TO organization_id;
    END IF;
    -- subscriptions
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'ngo_id') THEN
        ALTER TABLE public.subscriptions RENAME COLUMN ngo_id TO organization_id;
    END IF;
    -- member_preferences
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'member_preferences' AND column_name = 'ngo_id') THEN
        ALTER TABLE public.member_preferences RENAME COLUMN ngo_id TO organization_id;
    END IF;
    -- reports
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'ngo_id') THEN
        ALTER TABLE public.reports RENAME COLUMN ngo_id TO organization_id;
    END IF;
    -- allocations
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'allocations' AND column_name = 'ngo_id') THEN
        ALTER TABLE public.allocations RENAME COLUMN ngo_id TO organization_id;
    END IF;

    -- 6. Rename ngo_documents to organization_documents
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ngo_documents') THEN
        ALTER TABLE public.ngo_documents RENAME TO organization_documents;
    END IF;
    -- organization_documents.ngo_id -> organization_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_documents' AND column_name = 'ngo_id') THEN
        ALTER TABLE public.organization_documents RENAME COLUMN ngo_id TO organization_id;
    END IF;

END $$;
