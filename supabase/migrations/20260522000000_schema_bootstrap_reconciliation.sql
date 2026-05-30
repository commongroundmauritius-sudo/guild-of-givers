-- Schema Bootstrap Reconciliation
-- Minimal structural restoration to ensure migration chain consistency for fresh databases.
-- Full hardening and policies are handled in 20260606000000_schema_reconciliation.sql.

BEGIN;

-- 1. billing_runs
CREATE TABLE IF NOT EXISTS public.billing_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'pending',
    subscriptions_processed INTEGER DEFAULT 0,
    total_amount_mur NUMERIC DEFAULT 0,
    error_log TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. initiative_versions
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

-- 3. activities
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

-- 4. crm_tags
CREATE TABLE IF NOT EXISTS public.crm_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, name)
);

-- 5. crm_tag_assignments
CREATE TABLE IF NOT EXISTS public.crm_tag_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID REFERENCES public.crm_tags(id) ON DELETE CASCADE NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMIT;

-- 6. Enum Bootstrap
-- ALTER TYPE ... ADD VALUE must run at top-level and cannot be inside a DO block or Transaction.
-- We add these here to ensure they exist before migrations like 20260530000000 use them,
-- avoiding SQLSTATE 55P04 (unsafe use of new value).
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ngo';
