-- Schema Reconciliation Migration
-- Restores Proven Missing Category A tables to ensure migration consistency.
-- Enforces production-grade security, indexing, and data integrity.

BEGIN;

-- ==========================================
-- 1. ENUMS & TYPES
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'initiative_version_status') THEN
        CREATE TYPE public.initiative_version_status AS ENUM ('pending', 'approved', 'superseded', 'rejected');
    END IF;
END $$;

-- ==========================================
-- 2. TABLES
-- ==========================================

-- billing_runs
CREATE TABLE IF NOT EXISTS public.billing_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'pending',
    subscriptions_processed INTEGER DEFAULT 0,
    total_amount_mur NUMERIC DEFAULT 0,
    error_log TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT billing_runs_status_check CHECK (status IN ('pending', 'running', 'completed', 'failed'))
);

-- initiative_versions
CREATE TABLE IF NOT EXISTS public.initiative_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID REFERENCES public.initiatives(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    status public.initiative_version_status DEFAULT 'pending' NOT NULL,
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
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT crm_tag_assignments_target_check CHECK (
        (lead_id IS NOT NULL AND profile_id IS NULL) OR
        (lead_id IS NULL AND profile_id IS NOT NULL)
    )
);

-- ==========================================
-- 3. INDEXING & UNIQUENESS
-- ==========================================

-- billing_runs
CREATE INDEX IF NOT EXISTS idx_billing_runs_status_date ON public.billing_runs(status, run_date);

-- initiative_versions
CREATE INDEX IF NOT EXISTS idx_initiative_versions_initiative_id ON public.initiative_versions(initiative_id);
CREATE INDEX IF NOT EXISTS idx_initiative_versions_status ON public.initiative_versions(status);

-- activities
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_initiative_id ON public.activities(initiative_id);
CREATE INDEX IF NOT EXISTS idx_activities_organization_id ON public.activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_event_type ON public.activities(event_type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at);

-- crm_tags
CREATE INDEX IF NOT EXISTS idx_crm_tags_organization_id ON public.crm_tags(organization_id);

-- crm_tag_assignments
CREATE INDEX IF NOT EXISTS idx_crm_tag_assignments_tag_id ON public.crm_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_crm_tag_assignments_lead_id ON public.crm_tag_assignments(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_tag_assignments_profile_id ON public.crm_tag_assignments(profile_id) WHERE profile_id IS NOT NULL;

-- Partial unique indexes for crm_tag_assignments (Null-safe uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_tag_assignments_tag_lead_unique ON public.crm_tag_assignments(tag_id, lead_id) WHERE lead_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_tag_assignments_tag_profile_unique ON public.crm_tag_assignments(tag_id, profile_id) WHERE profile_id IS NOT NULL;

-- ==========================================
-- 4. HELPER FUNCTIONS
-- ==========================================

-- Performance-optimized org_id resolver for RLS
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS UUID AS $$
    SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Performance-optimized initiative-to-org resolver
CREATE OR REPLACE FUNCTION public.get_initiative_org_id(p_initiative_id UUID)
RETURNS UUID AS $$
    SELECT organization_id FROM public.initiatives WHERE id = p_initiative_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Performance-optimized tag-to-org resolver
CREATE OR REPLACE FUNCTION public.get_crm_tag_org_id(p_tag_id UUID)
RETURNS UUID AS $$
    SELECT organization_id FROM public.crm_tags WHERE id = p_tag_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ==========================================
-- 5. RLS & POLICIES (Strict Organization Isolation)
-- ==========================================

-- RLS Baseline: Default Deny
ALTER TABLE public.billing_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiative_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tag_assignments ENABLE ROW LEVEL SECURITY;

-- billing_runs: Admin only
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'billing_runs' AND policyname = 'Admins can manage billing_runs') THEN
        CREATE POLICY "Admins can manage billing_runs" ON public.billing_runs
        FOR ALL TO authenticated USING (public.has_role('admin'));
    END IF;
END $$;

-- initiative_versions: Admins ALL, Staff view/create own org
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'initiative_versions' AND policyname = 'Admins can manage all initiative versions') THEN
        CREATE POLICY "Admins can manage all initiative versions" ON public.initiative_versions
        FOR ALL TO authenticated USING (public.has_role('admin'));
    END IF;

    -- Strict Organization-Bound SELECT
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'initiative_versions' AND policyname = 'Staff can view own initiative versions') THEN
        CREATE POLICY "Staff can view own initiative versions" ON public.initiative_versions
        FOR SELECT TO authenticated USING (
            public.get_auth_org_id() = public.get_initiative_org_id(initiative_id)
        );
    END IF;

    -- Strict Organization-Bound INSERT
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'initiative_versions' AND policyname = 'Staff can create initiative versions') THEN
        CREATE POLICY "Staff can create initiative versions" ON public.initiative_versions
        FOR INSERT TO authenticated WITH CHECK (
            public.get_auth_org_id() = public.get_initiative_org_id(initiative_id)
        );
    END IF;
END $$;

-- activities: System insert, Admin all, Staff view own org org
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'System can insert activities') THEN
        CREATE POLICY "System can insert activities" ON public.activities
        FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Admins can manage all activities') THEN
        CREATE POLICY "Admins can manage all activities" ON public.activities
        FOR ALL TO authenticated USING (public.has_role('admin'));
    END IF;

    -- Strict Organization-Bound SELECT (Direct Org ID match)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Staff can view own organization activities') THEN
        CREATE POLICY "Staff can view own organization activities" ON public.activities
        FOR SELECT TO authenticated USING (
            organization_id = public.get_auth_org_id()
        );
    END IF;
END $$;

-- crm_tags: Staff manage own org
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_tags' AND policyname = 'Staff can manage own org tags') THEN
        CREATE POLICY "Staff can manage own org tags" ON public.crm_tags
        FOR ALL TO authenticated USING (
            organization_id = public.get_auth_org_id()
            OR public.has_role('admin')
        );
    END IF;
END $$;

-- crm_tag_assignments: Staff manage via tags
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_tag_assignments' AND policyname = 'Staff can manage tag assignments') THEN
        CREATE POLICY "Staff can manage tag assignments" ON public.crm_tag_assignments
        FOR ALL TO authenticated USING (
            public.get_crm_tag_org_id(tag_id) = public.get_auth_org_id()
            OR public.has_role('admin')
        );
    END IF;
END $$;

COMMIT;

