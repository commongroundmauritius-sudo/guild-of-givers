-- Partner Application System

-- 1. Roles & Types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'super_admin') THEN
        ALTER TYPE public.app_role ADD VALUE 'super_admin';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'partner_application_status') THEN
        CREATE TYPE public.partner_application_status AS ENUM (
            'submitted', 'under_review', 'contacted', 'approved', 'rejected', 'converted', 'archived'
        );
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Partner Applications Table
CREATE TABLE IF NOT EXISTS public.partner_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    organization_type TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    status public.partner_application_status DEFAULT 'submitted' NOT NULL,
    converted_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    converted_at TIMESTAMPTZ,
    converted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Partner Application Activity Table (Audit Logs)
CREATE TABLE IF NOT EXISTS public.partner_application_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.partner_applications(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'status_change', 'note_added', 'converted', etc.
    previous_status public.partner_application_status,
    new_status public.partner_application_status,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_partner_apps_email ON public.partner_applications(email);
CREATE INDEX IF NOT EXISTS idx_partner_apps_status ON public.partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partner_apps_created_at ON public.partner_applications(created_at);
CREATE INDEX IF NOT EXISTS idx_partner_app_activity_app_id ON public.partner_application_activity(application_id);

-- 5. RLS Policies
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_application_activity ENABLE ROW LEVEL SECURITY;

-- Public can insert (Apply)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partner_applications' AND policyname = 'Anyone can submit partner applications') THEN
        CREATE POLICY "Anyone can submit partner applications"
        ON public.partner_applications FOR INSERT
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partner_applications' AND policyname = 'Admins can manage partner applications') THEN
        CREATE POLICY "Admins can manage partner applications"
        ON public.partner_applications FOR ALL
        TO authenticated
        USING (public.has_role('admin') OR public.has_role('super_admin'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partner_application_activity' AND policyname = 'Admins can manage partner application activity') THEN
        CREATE POLICY "Admins can manage partner application activity"
        ON public.partner_application_activity FOR ALL
        TO authenticated
        USING (public.has_role('admin') OR public.has_role('super_admin'));
    END IF;
END $$;

-- 6. Updated At Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_partner_applications_updated_at') THEN
        CREATE TRIGGER tr_partner_applications_updated_at
            BEFORE UPDATE ON public.partner_applications
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- 7. Notification Helper for Applications
CREATE OR REPLACE FUNCTION public.notify_partner_application_change()
RETURNS TRIGGER AS $$
DECLARE
    admin_email TEXT := 'admin@commonground.mu'; -- Fallback or configurable
BEGIN
    -- On New Application
    IF (TG_OP = 'INSERT') THEN
        -- Confirmation to Applicant
        INSERT INTO public.email_queue (recipient, template_key, payload)
        VALUES (
            NEW.email,
            'partner_application_received',
            jsonb_build_object(
                'organization_name', NEW.organization_name,
                'application_id', NEW.id
            )
        );

        -- Notification to Admin
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

    -- On Status Change to 'approved'
    IF (TG_OP = 'UPDATE' AND OLD.status <> NEW.status AND NEW.status = 'approved') THEN
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

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_partner_application_notifications') THEN
        CREATE TRIGGER tr_partner_application_notifications
            AFTER INSERT OR UPDATE ON public.partner_applications
            FOR EACH ROW
            EXECUTE FUNCTION public.notify_partner_application_change();
    END IF;
END $$;
