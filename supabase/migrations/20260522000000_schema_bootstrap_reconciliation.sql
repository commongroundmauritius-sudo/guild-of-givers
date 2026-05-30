-- Schema Bootstrap Reconciliation
-- Minimal structural restoration to ensure migration chain consistency.

-- 1. Enum Seed (Top-level commands to ensure visibility and prevent SQLSTATE 55P04)
-- Adding these outside of any transaction block.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'organization';

-- 2. Structural Tables
BEGIN;

CREATE TABLE IF NOT EXISTS public.billing_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'pending',
    subscriptions_processed INTEGER DEFAULT 0,
    total_amount_mur NUMERIC DEFAULT 0,
    error_log TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

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

CREATE TABLE IF NOT EXISTS public.crm_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, name)
);

CREATE TABLE IF NOT EXISTS public.crm_tag_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID REFERENCES public.crm_tags(id) ON DELETE CASCADE NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMIT;

-- 3. has_role Overload
-- Provide a TEXT-based overload to bypass OID issues with new enum values in RLS policies.
CREATE OR REPLACE FUNCTION public.has_role(requested_role_name TEXT)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role::TEXT = requested_role_name
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
