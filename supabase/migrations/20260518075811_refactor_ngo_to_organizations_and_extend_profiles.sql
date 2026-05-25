-- Refactor NGO references to Organization and extend profile fields
-- This migration ensures the transition to organization terminology is complete with idempotency guards

BEGIN;

-- 1. Add organization app_role if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'organization') THEN
        ALTER TYPE public.app_role ADD VALUE 'organization';
    END IF;
END $$;

-- 2. Ensure organizations table exists with correct name
DO $$
BEGIN
    -- If legacy ngos table exists, rename it to organizations
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ngos')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
        ALTER TABLE public.ngos RENAME TO organizations;
    END IF;

    -- Rename column name to organization_name if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'name')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'organization_name') THEN
        ALTER TABLE public.organizations RENAME COLUMN name TO organization_name;
    END IF;
END $$;

-- 3. Extend profiles with new fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER;

-- Ensure age check constraint is handled
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'age_check') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT age_check CHECK (age >= 13 AND age <= 120);
    END IF;
END $$;

-- 4. Extend initiatives with metadata fields
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS is_unlimited BOOLEAN DEFAULT false;

-- 5. Handle Column/Table Renames in referencing tables
DO $$
BEGIN
    -- Handle profile organization_id rename if legacy exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ngo_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organization_id') THEN
        ALTER TABLE public.profiles RENAME COLUMN ngo_id TO organization_id;
    END IF;

    -- initiatives
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'ngo_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'organization_id') THEN
        ALTER TABLE public.initiatives RENAME COLUMN ngo_id TO organization_id;
    END IF;

    -- subscriptions
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'ngo_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'organization_id') THEN
        ALTER TABLE public.subscriptions RENAME COLUMN ngo_id TO organization_id;
    END IF;

    -- member_preferences
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'member_preferences' AND column_name = 'ngo_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'member_preferences' AND column_name = 'organization_id') THEN
        ALTER TABLE public.member_preferences RENAME COLUMN ngo_id TO organization_id;
    END IF;

    -- reports
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'ngo_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'organization_id') THEN
        ALTER TABLE public.reports RENAME COLUMN ngo_id TO organization_id;
    END IF;

    -- allocations
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'allocations' AND column_name = 'ngo_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'allocations' AND column_name = 'organization_id') THEN
        ALTER TABLE public.allocations RENAME COLUMN ngo_id TO organization_id;
    END IF;

    -- documents table RENAME
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ngo_documents')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_documents') THEN
        ALTER TABLE public.ngo_documents RENAME TO organization_documents;
    END IF;

    -- documents table column rename
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_documents' AND column_name = 'ngo_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_documents' AND column_name = 'organization_id') THEN
        ALTER TABLE public.organization_documents RENAME COLUMN ngo_id TO organization_id;
    END IF;
END $$;

COMMIT;
