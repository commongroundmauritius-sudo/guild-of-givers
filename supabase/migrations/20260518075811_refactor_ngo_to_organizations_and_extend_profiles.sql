-- Refactor Organization references to Organization and extend profile fields
-- This migration ensures the transition to organization terminology is complete

BEGIN;

-- 1. Add organization app_role if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'organization') THEN
        ALTER TYPE public.app_role ADD VALUE 'organization';
    END IF;
END $$;

-- 2. Ensure organizations table exists with correct name
-- (The initial schema should already use 'organizations', but we check for 'ngos' just in case of legacy drift)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ngos') THEN
        ALTER TABLE public.ngos RENAME TO organizations;
        ALTER TABLE public.organizations RENAME COLUMN name TO organization_name;
    END IF;
END $$;

-- 3. Extend profiles with new fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER;

-- Ensure age check constraint is handled in security_hardening migration
-- or add it here if not present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'age_check') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT age_check CHECK (age >= 13 AND age <= 120);
    END IF;
END $$;

-- 4. Extend initiatives with metadata fields
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS is_unlimited BOOLEAN DEFAULT false;

-- 5. Rename columns in referencing tables if needed
DO $$
BEGIN
    -- profiles
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organization_id') THEN
        ALTER TABLE public.profiles RENAME COLUMN organization_id TO organization_id;
    END IF;
    -- initiatives
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'organization_id') THEN
        ALTER TABLE public.initiatives RENAME COLUMN organization_id TO organization_id;
    END IF;
    -- others...
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'organization_id') THEN
        ALTER TABLE public.subscriptions RENAME COLUMN organization_id TO organization_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'member_preferences' AND column_name = 'organization_id') THEN
        ALTER TABLE public.member_preferences RENAME COLUMN organization_id TO organization_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'organization_id') THEN
        ALTER TABLE public.reports RENAME COLUMN organization_id TO organization_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'allocations' AND column_name = 'organization_id') THEN
        ALTER TABLE public.allocations RENAME COLUMN organization_id TO organization_id;
    END IF;
    -- documents table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ngo_documents') THEN
        ALTER TABLE public.ngo_documents RENAME TO organization_documents;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_documents' AND column_name = 'organization_id') THEN
        ALTER TABLE public.organization_documents RENAME COLUMN organization_id TO organization_id;
    END IF;
END $$;

COMMIT;
