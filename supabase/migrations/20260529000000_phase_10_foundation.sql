-- 1. Automation Infrastructure
CREATE TABLE IF NOT EXISTS public.automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL, -- e.g., 'activity', 'event', 'cron', 'threshold'
    trigger_config JSONB DEFAULT '{}'::jsonb,
    conditions JSONB DEFAULT '[]'::jsonb,
    actions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES public.automation_rules(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    entity_id UUID, -- Flexible ID (could be initiative_id, payment_id, etc.)
    status TEXT DEFAULT 'pending', -- pending, completed, failed
    result JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES public.automation_executions(id) ON DELETE CASCADE,
    level TEXT DEFAULT 'info',
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Supporter Engagement Scoring
CREATE TABLE IF NOT EXISTS public.supporter_engagement_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    engagement_score INTEGER NOT NULL CHECK (engagement_score >= 0 AND engagement_score <= 100),
    engagement_level TEXT NOT NULL, -- e.g., 'Low', 'Medium', 'High', 'Elite'
    score_breakdown JSONB DEFAULT '{}'::jsonb,
    calculated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CRM Tasks (Operational Tooling)
CREATE TABLE IF NOT EXISTS public.crm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    status TEXT DEFAULT 'open', -- open, in_progress, completed, cancelled
    priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Dynamic Segmentation
CREATE TABLE IF NOT EXISTS public.segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    filter_definition JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Recommendation Foundations (Supporter Interests)
CREATE TABLE IF NOT EXISTS public.supporter_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    interest_score NUMERIC DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, category)
);

-- 6. RLS Policies
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supporter_engagement_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supporter_interests ENABLE ROW LEVEL SECURITY;

-- Automation Rules RLS
DROP POLICY IF EXISTS "Orgs can manage their own automation rules" ON public.automation_rules;
CREATE POLICY "Orgs can manage their own automation rules"
ON public.automation_rules FOR ALL
TO authenticated
USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT public.has_role('admin'))
);

-- Automation Executions RLS
DROP POLICY IF EXISTS "Orgs can view their own automation executions" ON public.automation_executions;
CREATE POLICY "Orgs can view their own automation executions"
ON public.automation_executions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.automation_rules r
        WHERE r.id = automation_executions.rule_id
        AND (r.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR (SELECT public.has_role('admin')))
    )
);

-- Automation Logs RLS
DROP POLICY IF EXISTS "Orgs can view their own automation logs" ON public.automation_logs;
CREATE POLICY "Orgs can view their own automation logs"
ON public.automation_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.automation_executions e
        JOIN public.automation_rules r ON e.rule_id = r.id
        WHERE e.id = automation_logs.execution_id
        AND (r.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR (SELECT public.has_role('admin')))
    )
);

-- Supporter Engagement Scores RLS
DROP POLICY IF EXISTS "Orgs can view scores of their supporters" ON public.supporter_engagement_scores;
CREATE POLICY "Orgs can view scores of their supporters"
ON public.supporter_engagement_scores FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = supporter_engagement_scores.user_id
        AND (p.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR (SELECT public.has_role('admin')))
    )
);

-- CRM Tasks RLS
DROP POLICY IF EXISTS "Orgs can manage their own crm tasks" ON public.crm_tasks;
CREATE POLICY "Orgs can manage their own crm tasks"
ON public.crm_tasks FOR ALL
TO authenticated
USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT public.has_role('admin'))
);

-- Segments RLS
DROP POLICY IF EXISTS "Orgs can manage their own segments" ON public.segments;
CREATE POLICY "Orgs can manage their own segments"
ON public.segments FOR ALL
TO authenticated
USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT public.has_role('admin'))
);

-- Supporter Interests RLS
DROP POLICY IF EXISTS "Orgs can view interests of their supporters" ON public.supporter_interests;
CREATE POLICY "Orgs can view interests of their supporters"
ON public.supporter_interests FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = supporter_interests.user_id
        AND (p.organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR (SELECT public.has_role('admin')))
    )
);

-- 7. Engagement Scoring Logic
CREATE OR REPLACE FUNCTION public.calculate_supporter_engagement_scores()
RETURNS VOID AS $$
DECLARE
    rec RECORD;
    v_score INTEGER;
    v_level TEXT;
    v_breakdown JSONB;
    v_activity_count INTEGER;
    v_payment_count INTEGER;
    v_subscription_active BOOLEAN;
BEGIN
    FOR rec IN SELECT id, organization_id FROM public.profiles LOOP
        -- Simple heuristic scoring
        -- 1. Activity Frequency (last 30 days)
        SELECT COUNT(*) INTO v_activity_count
        FROM public.activities
        WHERE user_id = rec.id AND created_at >= now() - INTERVAL '30 days';

        -- 2. Successful Payments (all time)
        SELECT COUNT(*) INTO v_payment_count
        FROM public.payments
        WHERE user_id = rec.id AND status = 'success';

        -- 3. Active Subscription
        SELECT EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id = rec.id AND status = 'active')
        INTO v_subscription_active;

        -- Weighting: Activity (max 40), Payments (max 30), Subscription (30)
        v_score := LEAST(v_activity_count * 5, 40) + LEAST(v_payment_count * 10, 30) + (CASE WHEN v_subscription_active THEN 30 ELSE 0 END);

        v_level := CASE
            WHEN v_score >= 80 THEN 'Elite'
            WHEN v_score >= 50 THEN 'High'
            WHEN v_score >= 20 THEN 'Medium'
            ELSE 'Low'
        END;

        v_breakdown := jsonb_build_object(
            'activity_score', LEAST(v_activity_count * 5, 40),
            'payment_score', LEAST(v_payment_count * 10, 30),
            'subscription_bonus', (CASE WHEN v_subscription_active THEN 30 ELSE 0 END),
            'last_30d_activities', v_activity_count,
            'total_payments', v_payment_count
        );

        INSERT INTO public.supporter_engagement_scores (
            user_id,
            engagement_score,
            engagement_level,
            score_breakdown,
            calculated_at
        ) VALUES (
            rec.id,
            v_score,
            v_level,
            v_breakdown,
            now()
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
