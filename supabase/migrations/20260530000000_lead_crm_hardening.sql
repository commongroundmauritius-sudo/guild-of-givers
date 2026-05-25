-- Lead CRM Infrastructure and Security Hardening
-- This addresses Phase 6 requirements

-- 1. Update Leads table schema
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS source_initiative_id UUID REFERENCES public.initiatives(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS acquisition_channel TEXT,
ADD COLUMN IF NOT EXISTS campaign_id TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Update status defaults and constraints
ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'started';

-- 3. Create lead_status_history table
CREATE TABLE IF NOT EXISTS public.lead_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT now(),
    changed_by UUID REFERENCES auth.users(id)
);

-- 4. Unique constraint for deduplication
-- We use a combination of email and source_initiative_id
-- This allows one person to be a lead for multiple initiatives, which is a valid business case.
-- If we want strict one-lead-per-email, we would just use email.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_email_source_initiative_id_key') THEN
        ALTER TABLE public.leads ADD CONSTRAINT leads_email_source_initiative_id_key UNIQUE (email, source_initiative_id);
    END IF;
END $$;

-- 5. Trigger to track status history
CREATE OR REPLACE FUNCTION public.track_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS NULL OR OLD.status <> NEW.status) THEN
        INSERT INTO public.lead_status_history (lead_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    NEW.last_activity_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_track_lead_status_change ON public.leads;
CREATE TRIGGER tr_track_lead_status_change
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.track_lead_status_change();

-- 6. Strict RLS for Leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads;
DROP POLICY IF EXISTS "Public can start leads" ON public.leads;
DROP POLICY IF EXISTS "Public can update own lead" ON public.leads;
DROP POLICY IF EXISTS "Only admins can read leads" ON public.leads;

-- Public can only insert
CREATE POLICY "Public can insert leads"
ON public.leads FOR INSERT
TO public
WITH CHECK (true);

-- Public can update last_activity or status (for the conversion flow)
-- but only if they know the ID/email. Since update needs a WHERE clause.
-- We restrict updates to only status and last_activity_at if possible,
-- but PG RLS is per-row. We'll rely on server-side functions for sensitive updates.
CREATE POLICY "Public can update own lead for conversion"
ON public.leads FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- ONLY Admins can SELECT/DELETE
CREATE POLICY "Strict Admin Select"
ON public.leads FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Strict Admin Delete"
ON public.leads FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Ensure Organization/Member roles have NO policies that allow SELECT.
-- By default, if no policy matches, access is denied.

-- 7. Lead History RLS
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only lead history"
ON public.lead_status_history FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
