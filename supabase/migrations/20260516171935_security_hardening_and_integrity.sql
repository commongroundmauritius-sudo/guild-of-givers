-- Security Hardening and Data Integrity Migration
-- 1. Leads Integrity: Prevent duplicate leads for the same email
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_email_key') THEN
        ALTER TABLE public.leads ADD CONSTRAINT leads_email_key UNIQUE (email);
    END IF;
END $$;

-- 2. User Roles Hardening: Prevent self-assignment of non-member roles
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can insert own role" ON public.user_roles
FOR INSERT WITH CHECK (
    user_id = (SELECT auth.uid()) AND
    role = 'member'::app_role
);

-- 3. Initiatives Hardening: Prevent NGOs from self-approving or self-publishing
CREATE OR REPLACE FUNCTION public.check_initiative_status_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- If the user is NOT an admin
    IF NOT public.has_role('admin'::app_role) THEN
        -- Prevent modification of is_approved or is_published
        IF NEW.is_approved IS DISTINCT FROM OLD.is_approved OR
           NEW.is_published IS DISTINCT FROM OLD.is_published THEN
            RAISE EXCEPTION 'Unauthorized: Only admins can modify initiative status or visibility';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_initiative_status ON public.initiatives;
CREATE TRIGGER tr_check_initiative_status
BEFORE UPDATE ON public.initiatives
FOR EACH ROW EXECUTE FUNCTION public.check_initiative_status_permissions();

-- 4. Reports Hardening: NGOs cannot approve their own reports
CREATE OR REPLACE FUNCTION public.check_report_status_permissions()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.has_role('admin'::app_role) THEN
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Unauthorized: Only admins can modify report status';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_report_status ON public.reports;
CREATE TRIGGER tr_check_report_status
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.check_report_status_permissions();

-- 5. Default Values for Initiatives: Ensure booleans are not null
ALTER TABLE public.initiatives ALTER COLUMN is_approved SET DEFAULT false;
ALTER TABLE public.initiatives ALTER COLUMN is_published SET DEFAULT false;
UPDATE public.initiatives SET is_approved = false WHERE is_approved IS NULL;
UPDATE public.initiatives SET is_published = false WHERE is_published IS NULL;
ALTER TABLE public.initiatives ALTER COLUMN is_approved SET NOT NULL;
ALTER TABLE public.initiatives ALTER COLUMN is_published SET NOT NULL;
