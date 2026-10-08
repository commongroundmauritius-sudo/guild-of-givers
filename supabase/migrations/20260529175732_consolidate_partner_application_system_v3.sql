-- 1. Ensure partner_applications has the correct structure and defaults
ALTER TABLE public.partner_applications 
  ALTER COLUMN status SET DEFAULT 'submitted'::partner_application_status,
  ALTER COLUMN created_at SET DEFAULT now();

-- Ensure all required columns exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_applications' AND column_name = 'contact_name') THEN
        ALTER TABLE public.partner_applications ADD COLUMN contact_name text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_applications' AND column_name = 'phone') THEN
        ALTER TABLE public.partner_applications ADD COLUMN phone text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_applications' AND column_name = 'website') THEN
        ALTER TABLE public.partner_applications ADD COLUMN website text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_applications' AND column_name = 'admin_notes') THEN
        ALTER TABLE public.partner_applications ADD COLUMN admin_notes text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_applications' AND column_name = 'reviewed_by') THEN
        ALTER TABLE public.partner_applications ADD COLUMN reviewed_by uuid REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_applications' AND column_name = 'reviewed_at') THEN
        ALTER TABLE public.partner_applications ADD COLUMN reviewed_at timestamp with time zone;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_applications' AND column_name = 'is_deleted') THEN
        ALTER TABLE public.partner_applications ADD COLUMN is_deleted boolean DEFAULT false;
    END IF;
END $$;

-- 2. Migrate data from organization_contact_applications to partner_applications
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_contact_applications') THEN
        INSERT INTO public.partner_applications (
            id, created_at, organization_name, contact_name, email, phone, website, 
            message, organization_type, status, admin_notes, reviewed_by, reviewed_at, 
            converted_organization_id, converted_at, converted_by, deleted_at, registration_number
        )
        SELECT 
            id, created_at, organization_name, contact_name, email, phone, website, 
            message, organization_type, status::text::partner_application_status, admin_notes, reviewed_by, reviewed_at, 
            converted_organization_id, converted_at, converted_by, deleted_at, registration_number
        FROM public.organization_contact_applications
        ON CONFLICT (id) DO UPDATE SET
            contact_name = EXCLUDED.contact_name,
            phone = EXCLUDED.phone,
            website = EXCLUDED.website,
            admin_notes = EXCLUDED.admin_notes,
            reviewed_by = EXCLUDED.reviewed_by,
            reviewed_at = EXCLUDED.reviewed_at;
    END IF;
END $$;

-- 3. Migrate data from organization_application_status_history to partner_application_activity
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_application_status_history') THEN
        INSERT INTO public.partner_application_activity (
            id, application_id, actor_id, action, previous_status, new_status, metadata, created_at
        )
        SELECT 
            id, 
            application_id, 
            changed_by as actor_id, 
            'status_change' as action, 
            old_status::text::partner_application_status as previous_status, 
            new_status::text::partner_application_status as new_status, 
            jsonb_build_object('notes', notes) as metadata, 
            changed_at as created_at
        FROM public.organization_application_status_history
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 4. Standardize Functions and Triggers
CREATE OR REPLACE FUNCTION public.check_duplicate_application()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.partner_applications
        WHERE email = NEW.email
        AND created_at > (now() - INTERVAL '24 hours')
        AND status IN ('submitted', 'under_review', 'contacted')
        AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'An active application with this email already exists within the last 24 hours.';
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_partner_application_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    admin_email TEXT := 'admin@commonground.mu';
BEGIN
    -- On New Application
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.email_queue (recipient, template_key, payload)
        VALUES (
            NEW.email,
            'partner_application_received',
            jsonb_build_object(
                'organization_name', NEW.organization_name,
                'application_id', NEW.id
            )
        );

        INSERT INTO public.email_queue (recipient, template_key, payload)
        VALUES (
            admin_email,
            'admin_new_partner_application',
            jsonb_build_object(
                'organization_name', NEW.organization_name,
                'applicant_email', NEW.email,
                'application_id', NEW.id
            )
        );
    END IF;

    -- On Status Change
    IF (TG_OP = 'UPDATE' AND OLD.status <> NEW.status) THEN
         IF NEW.status = 'approved' THEN
             INSERT INTO public.email_queue (recipient, template_key, payload)
             VALUES (
                 NEW.email,
                 'partner_application_approved',
                 jsonb_build_object(
                     'organization_name', NEW.organization_name,
                     'application_id', NEW.id
                 )
             );
         END IF;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_partner_app_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NOT EXISTS (SELECT 1 FROM public.partner_application_activity WHERE application_id = NEW.id AND action = 'submitted') THEN
            INSERT INTO public.partner_application_activity (application_id, action, new_status, metadata)
            VALUES (NEW.id, 'submitted', NEW.status, jsonb_build_object('message', 'Application submitted'));
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status <> NEW.status) THEN
            INSERT INTO public.partner_application_activity (application_id, actor_id, action, previous_status, new_status, metadata)
            VALUES (
                NEW.id, 
                COALESCE(NEW.reviewed_by, NEW.converted_by), 
                'status_change', 
                OLD.status, 
                NEW.status, 
                jsonb_build_object('message', 'Status changed from ' || OLD.status::text || ' to ' || NEW.status::text)
            );
        END IF;
        
        IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
            INSERT INTO public.partner_application_activity (application_id, action, metadata)
            VALUES (NEW.id, 'archived', jsonb_build_object('message', 'Application archived'));
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

-- Apply Triggers
DROP TRIGGER IF EXISTS trg_check_duplicate_partner_application ON public.partner_applications;
CREATE TRIGGER trg_check_duplicate_partner_application
    BEFORE INSERT ON public.partner_applications
    FOR EACH ROW EXECUTE FUNCTION check_duplicate_application();

DROP TRIGGER IF EXISTS tr_partner_application_notifications ON public.partner_applications;
CREATE TRIGGER tr_partner_application_notifications
    AFTER INSERT OR UPDATE ON public.partner_applications
    FOR EACH ROW EXECUTE FUNCTION notify_partner_application_change();

DROP TRIGGER IF EXISTS tr_partner_application_activity ON public.partner_applications;
CREATE TRIGGER tr_partner_application_activity
    AFTER INSERT OR UPDATE ON public.partner_applications
    FOR EACH ROW EXECUTE FUNCTION log_partner_app_activity();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_partner_apps_email ON public.partner_applications(email);
CREATE INDEX IF NOT EXISTS idx_partner_apps_status ON public.partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partner_apps_created_at ON public.partner_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_apps_org_type ON public.partner_applications(organization_type);

-- 6. Cleanup
DROP TABLE IF EXISTS public.organization_application_status_history;
DROP TABLE IF EXISTS public.organization_contact_applications CASCADE;
DROP FUNCTION IF EXISTS public.log_org_app_status_change();

