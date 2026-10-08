-- Create status history table for applications
CREATE TABLE IF NOT EXISTS public.organization_application_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.organization_contact_applications(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT
);

-- Enable RLS
ALTER TABLE public.organization_application_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for status history
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_application_status_history' AND policyname = 'Admins can view history') THEN
        CREATE POLICY "Admins can view history" 
        ON public.organization_application_status_history 
        FOR SELECT 
        USING (
            public.has_role('admin') OR public.has_role('super_admin')
        );
    END IF;
END $$;

-- Trigger to automatically log status changes
CREATE OR REPLACE FUNCTION public.log_org_app_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.organization_application_status_history (application_id, new_status, notes)
        VALUES (NEW.id, NEW.status, 'Initial submission');
    ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.organization_application_status_history (application_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_org_app_status_change
AFTER INSERT OR UPDATE ON public.organization_contact_applications
FOR EACH ROW
EXECUTE FUNCTION public.log_org_app_status_change();

-- Grant permissions
GRANT SELECT ON public.organization_application_status_history TO authenticated;

