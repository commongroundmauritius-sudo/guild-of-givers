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
    -- Legacy table rename only if legacy table exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'ngo'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'organizations'
    )
    THEN
        ALTER TABLE public.ngo RENAME TO organizations;
    END IF;

    -- Rename column only if old column exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'organizations'
        AND column_name = 'name'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'organizations'
        AND column_name = 'organization_name'
    )
    THEN
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

-- 5. Guarded rename for related tables if legacy versions exist
DO $$
BEGIN
    -- organization_documents
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ngo_documents')
    AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_documents') THEN
        ALTER TABLE public.ngo_documents RENAME TO organization_documents;
    END IF;

    -- Update column names in organization_documents if they are still using ngo_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_documents' AND column_name = 'ngo_id')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_documents' AND column_name = 'organization_id') THEN
        ALTER TABLE public.organization_documents RENAME COLUMN ngo_id TO organization_id;
    END IF;
END $$;

COMMIT;
