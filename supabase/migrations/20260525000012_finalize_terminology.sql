-- Finalize Terminology Normalization
-- Ensures all DB objects and comments use 'Organization'

BEGIN;

-- 1. Standardize any remaining comments
COMMENT ON TABLE public.organizations IS 'Primary table for registered organizations (formerly NGOs)';
COMMENT ON COLUMN public.profiles.organization_id IS 'Link to the organization this user represents';

-- 2. Audit and update financial account type descriptions if needed
-- (The enum value change was handled in 20260525000010)

COMMIT;
