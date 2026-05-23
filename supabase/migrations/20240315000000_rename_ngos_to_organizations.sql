-- Terminology Alignment: NGO -> Organization
-- This migration handles legacy environments where 'ngo' was used.
DO $$
BEGIN
    -- 1. Rename table 'ngos' to 'organizations' if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ngos') THEN
        ALTER TABLE public.ngos RENAME TO organizations;
    END IF;

    -- 2. Standardize column 'name' to 'organization_name'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'name') THEN
        ALTER TABLE public.organizations RENAME COLUMN name TO organization_name;
    END IF;

    -- 3. Rename foreign key columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'ngo_id') THEN
        ALTER TABLE public.initiatives RENAME COLUMN ngo_id TO organization_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'ngo_id') THEN
        ALTER TABLE public.reports RENAME COLUMN ngo_id TO organization_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ngo_id') THEN
        ALTER TABLE public.profiles RENAME COLUMN ngo_id TO organization_id;
    END IF;

    -- 4. Add 'organization' to app_role enum if not present
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'app_role' AND e.enumlabel = 'organization') THEN
        ALTER TYPE public.app_role ADD VALUE 'organization';
    END IF;

END $$;
