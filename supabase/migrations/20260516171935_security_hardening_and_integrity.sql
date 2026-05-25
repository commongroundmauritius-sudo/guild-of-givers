-- Database Security Hardening and Data Integrity

BEGIN;

-- 1. Function Search Path Security
-- Explicitly set search_path to public for all security definer functions
ALTER FUNCTION public.has_role(public.app_role) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 2. Profile Integrity
-- Ensure age is valid if provided (handled in refactor_organization migration as well, but being defensive)
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS age_check;
    ALTER TABLE public.profiles ADD CONSTRAINT age_check CHECK (age >= 13 AND age <= 120);
EXCEPTION
    WHEN undefined_column THEN null;
END $$;

-- 3. Initiatives Hardening: Prevent Organizations from self-approving or self-publishing
CREATE OR REPLACE FUNCTION public.check_initiative_permissions()
RETURNS trigger AS $$
BEGIN
    -- If user is admin, allow everything
    IF public.has_role('admin') THEN
        RETURN NEW;
    END IF;

    -- Prevent modification of is_approved or is_published
    IF NEW.is_approved IS DISTINCT FROM OLD.is_approved OR
       NEW.is_published IS DISTINCT FROM OLD.is_published THEN
        RAISE EXCEPTION 'Only admins can approve or publish initiatives';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_check_initiative_permissions ON public.initiatives;
CREATE TRIGGER tr_check_initiative_permissions
BEFORE UPDATE ON public.initiatives
FOR EACH ROW EXECUTE FUNCTION public.check_initiative_permissions();

-- 4. Reports Hardening: Organizations cannot approve their own reports
-- Assuming reports have a status or verification field (adding if not exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_review';
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.check_report_status_permissions()
RETURNS trigger AS $$
BEGIN
    IF public.has_role('admin') THEN
        RETURN NEW;
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'Only admins can change report status';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        DROP TRIGGER IF EXISTS tr_check_report_status_permissions ON public.reports;
        CREATE TRIGGER tr_check_report_status_permissions
        BEFORE UPDATE ON public.reports
        FOR EACH ROW EXECUTE FUNCTION public.check_report_status_permissions();
    END IF;
END $$;

-- 5. Data Defaults and Constraints
ALTER TABLE public.initiatives ALTER COLUMN is_approved SET DEFAULT false;
UPDATE public.initiatives SET is_approved = false WHERE is_approved IS NULL;
ALTER TABLE public.initiatives ALTER COLUMN is_approved SET NOT NULL;

COMMIT;
