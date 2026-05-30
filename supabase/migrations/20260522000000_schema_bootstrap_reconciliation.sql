-- Schema Bootstrap Reconciliation
-- Minimal structural restoration to ensure migration chain consistency.
-- Enums are added first to avoid SQLSTATE 55P04 in subsequent migrations.

-- 1. Enum Bootstrap (Must run outside transaction)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ngo';

-- 2. Structural Tables
BEGIN;

-- billing_runs
CREATE TABLE IF NOT EXISTS public.billing_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'pending',
    subscriptions_processed INTEGER DEFAULT 0,
    total_amount_mur NUMERIC DEFAULT 0,
    error_log TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- initiative_versions
CREATE TABLE IF NOT EXISTS public.initiative_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID REFERENCES public.initiatives(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    title TEXT,
    description TEXT,
    summary TEXT,
    content TEXT,
    image_url TEXT,
    media_url TEXT,
    category TEXT,
    short_term_goals TEXT,
    long_term_goals TEXT,
    target_milestones TEXT,
    expected_outcomes TEXT,
    goal_amount_mur NUMERIC,
    impact_pool_target NUMERIC,
    admin_feedback TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- activities
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    initiative_id UUID REFERENCES public.initiatives(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- crm_tags
CREATE TABLE IF NOT EXISTS public.crm_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, name)
);

-- crm_tag_assignments
CREATE TABLE IF NOT EXISTS public.crm_tag_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID REFERENCES public.crm_tags(id) ON DELETE CASCADE NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMIT;

-- 3. Refresh has_role to ensure it recognizes the updated enum type
CREATE OR REPLACE FUNCTION public.has_role(requested_role public.app_role)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = requested_role
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
