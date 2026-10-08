-- Growth, Attribution, CRM, and Analytics Foundation
-- Phase 1-5 Database Schema

-- 1. Extend Initiatives for Curation
ALTER TABLE public.initiatives
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;

-- 2. Campaign Links (Attribution/Referral Links)
CREATE TABLE IF NOT EXISTS public.campaign_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID REFERENCES public.initiatives(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    tracking_code TEXT NOT NULL UNIQUE,
    source_type TEXT NOT NULL, -- 'facebook', 'email', 'qr', 'homepage', etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaign_links_tracking_code ON public.campaign_links(tracking_code);
CREATE INDEX IF NOT EXISTS idx_campaign_links_initiative_id ON public.campaign_links(initiative_id);

-- 3. CRM Campaigns (Future Marketing Campaigns)
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT DEFAULT 'draft', -- 'draft', 'active', 'completed', 'cancelled'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaigns_organization_id ON public.campaigns(organization_id);

-- 4. Activities / Event Tracking System
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    initiative_id UUID REFERENCES public.initiatives(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    source TEXT, -- 'frontend', 'backend', 'system'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activities_event_type ON public.activities(event_type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_initiative_id ON public.activities(initiative_id);
CREATE INDEX IF NOT EXISTS idx_activities_organization_id ON public.activities(organization_id);

-- 5. CRM Core: Tags and Notes
CREATE TABLE IF NOT EXISTS public.crm_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, name)
);

CREATE TABLE IF NOT EXISTS public.crm_tag_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID REFERENCES public.crm_tags(id) ON DELETE CASCADE NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT one_target_required CHECK (
        (lead_id IS NOT NULL AND profile_id IS NULL) OR
        (lead_id IS NULL AND profile_id IS NOT NULL)
    ),
    UNIQUE(tag_id, lead_id),
    UNIQUE(tag_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.crm_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT one_note_target_required CHECK (
        lead_id IS NOT NULL OR profile_id IS NOT NULL
    )
);

-- 6. Extend Leads for Lifecycle and Attribution
DO $$
BEGIN
    -- Check if lead_stage column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'lead_stage') THEN
        ALTER TABLE public.leads ADD COLUMN lead_stage TEXT DEFAULT 'Visitor';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'campaign_link_id') THEN
        ALTER TABLE public.leads ADD COLUMN campaign_link_id UUID REFERENCES public.campaign_links(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'utm_parameters') THEN
        ALTER TABLE public.leads ADD COLUMN utm_parameters JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 7. RLS Policies

-- Enable RLS
ALTER TABLE public.campaign_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;

-- Campaign Links RLS
CREATE POLICY "Anyone can view active campaign links"
ON public.campaign_links FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage campaign links"
ON public.campaign_links FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Organization staff can manage own campaign links"
ON public.campaign_links FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.initiatives i ON i.organization_id = p.organization_id
    WHERE p.id = auth.uid() AND i.id = campaign_links.initiative_id
  )
);

-- Campaigns RLS
CREATE POLICY "Admins can manage all campaigns"
ON public.campaigns FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Org staff can manage own campaigns"
ON public.campaigns FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.organization_id = campaigns.organization_id
  )
);

-- Activities RLS
CREATE POLICY "Admins can view all activities"
ON public.activities FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can view own activities"
ON public.activities FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can insert activities"
ON public.activities FOR INSERT
TO public
WITH CHECK (true);

-- CRM Tags RLS
CREATE POLICY "Org staff can manage tags"
ON public.crm_tags FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.organization_id = crm_tags.organization_id
  )
);

-- CRM Tag Assignments RLS
CREATE POLICY "Org staff can manage tag assignments"
ON public.crm_tag_assignments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crm_tags t
    JOIN public.profiles p ON p.organization_id = t.organization_id
    WHERE p.id = auth.uid() AND t.id = crm_tag_assignments.tag_id
  )
);

-- CRM Notes RLS
CREATE POLICY "Org staff can manage notes"
ON public.crm_notes FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.organization_id = crm_notes.organization_id
  )
);

CREATE POLICY "Admins can view all notes"
ON public.crm_notes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 8. Business Logic Triggers for Reliable Events

-- Trigger to log user signup activity
CREATE OR REPLACE FUNCTION public.log_user_signup_activity()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.activities (user_id, event_type, source, metadata)
  VALUES (new.id, 'user_signup', 'backend', jsonb_build_object(
    'email', new.email,
    'full_name', new.raw_user_meta_data->>'full_name'
  ));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_log_user_signup ON auth.users;
CREATE TRIGGER tr_log_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.log_user_signup_activity();

-- Trigger to log successful payment activity
CREATE OR REPLACE FUNCTION public.log_payment_activity()
RETURNS trigger AS $$
BEGIN
  IF (NEW.status = 'success') THEN
    INSERT INTO public.activities (user_id, event_type, source, metadata)
    VALUES (NEW.user_id, 'payment_completed', 'backend', jsonb_build_object(
      'payment_id', NEW.id,
      'amount', NEW.amount_mur,
      'subscription_id', NEW.subscription_id
    ));

    -- Update lead stage for the user if they were a lead
    UPDATE public.leads
    SET lead_stage = 'Subscriber',
        last_activity_at = now()
    WHERE email = (SELECT email FROM public.profiles WHERE id = NEW.user_id)
    AND status = 'converted';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_log_payment_success ON public.payments;
CREATE TRIGGER tr_log_payment_success
  AFTER UPDATE OF status ON public.payments
  FOR EACH ROW
  WHEN (NEW.status = 'success' AND OLD.status <> 'success')
  EXECUTE FUNCTION public.log_payment_activity();

-- Update lead stage to "Registered User" when a profile is created
CREATE OR REPLACE FUNCTION public.update_lead_stage_on_registration()
RETURNS trigger AS $$
BEGIN
  UPDATE public.leads
  SET lead_stage = 'Registered User',
      last_activity_at = now()
  WHERE email = NEW.email
  AND lead_stage = 'Visitor';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_update_lead_stage_on_registration ON public.profiles;
CREATE TRIGGER tr_update_lead_stage_on_registration
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_lead_stage_on_registration();
