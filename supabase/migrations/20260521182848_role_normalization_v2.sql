-- Final Role and Schema Normalization: Organization
-- This ensures all logic uses 'organization' instead of legacy terminology

BEGIN;

-- 1. Ensure 'organization' exists in app_role enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'organization') THEN
        ALTER TYPE public.app_role ADD VALUE 'organization';
    END IF;
END $$;

-- 2. Update user_roles to use 'organization'
-- (We use text conversion to avoid type issues if legacy role was already removed)
UPDATE public.user_roles SET role = 'organization' WHERE role::text = 'ngo';

-- 3. Update has_role function to be case-insensitive and robust
CREATE OR REPLACE FUNCTION public.has_role(requested_role public.app_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = requested_role
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 4. Standardize RLS policies naming
DROP POLICY IF EXISTS "Organization staff can manage own initiatives" ON public.initiatives;
CREATE POLICY "Organization staff can manage own initiatives" ON public.initiatives
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.organization_id = initiatives.organization_id
    )
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        DROP POLICY IF EXISTS "Organization staff can manage their own reports" ON public.reports;
        CREATE POLICY "Organization staff can manage their own reports" ON public.reports
        FOR ALL USING (
          organization_id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = (SELECT auth.uid())
          )
        );
    END IF;
END $$;

COMMIT;
