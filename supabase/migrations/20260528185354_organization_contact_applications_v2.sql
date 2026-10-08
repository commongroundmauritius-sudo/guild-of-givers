-- Create organization_contact_applications table
CREATE TABLE IF NOT EXISTS public.organization_contact_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    organization_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    website TEXT,
    message TEXT NOT NULL,
    organization_type TEXT NOT NULL,
    status TEXT DEFAULT 'submitted' NOT NULL,
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    converted_organization_id UUID REFERENCES public.organizations(id),
    converted_at TIMESTAMP WITH TIME ZONE,
    converted_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.organization_contact_applications ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_apps_email ON public.organization_contact_applications(email);
CREATE INDEX IF NOT EXISTS idx_org_apps_status ON public.organization_contact_applications(status);
CREATE INDEX IF NOT EXISTS idx_org_apps_created_at ON public.organization_contact_applications(created_at);

-- RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_contact_applications' AND policyname = 'Public can insert applications') THEN
        CREATE POLICY "Public can insert applications" 
        ON public.organization_contact_applications 
        FOR INSERT 
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_contact_applications' AND policyname = 'Admins can view applications') THEN
        CREATE POLICY "Admins can view applications" 
        ON public.organization_contact_applications 
        FOR SELECT 
        USING (
            public.has_role('admin') OR public.has_role('super_admin')
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_contact_applications' AND policyname = 'Admins can update applications') THEN
        CREATE POLICY "Admins can update applications" 
        ON public.organization_contact_applications 
        FOR UPDATE 
        USING (
            public.has_role('admin') OR public.has_role('super_admin')
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_contact_applications' AND policyname = 'Admins can delete applications') THEN
        CREATE POLICY "Admins can delete applications" 
        ON public.organization_contact_applications 
        FOR DELETE 
        USING (
            public.has_role('admin') OR public.has_role('super_admin')
        );
    END IF;
END $$;

-- Duplicate protection function
CREATE OR REPLACE FUNCTION public.check_duplicate_application()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.organization_contact_applications
        WHERE email = NEW.email
        AND created_at > (now() - INTERVAL '24 hours')
        AND status NOT IN ('rejected', 'archived')
    ) THEN
        RAISE EXCEPTION 'An active application with this email already exists within the last 24 hours.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Duplicate protection trigger
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_check_duplicate_application') THEN
        CREATE TRIGGER trg_check_duplicate_application
        BEFORE INSERT ON public.organization_contact_applications
        FOR EACH ROW
        EXECUTE FUNCTION public.check_duplicate_application();
    END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_contact_applications TO authenticated;
GRANT INSERT ON public.organization_contact_applications TO anon;

