-- Relationship Intelligence & Health Scoring Layer

-- 1. Initiative Health Scores Table
CREATE TABLE IF NOT EXISTS public.initiative_health_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID REFERENCES public.initiatives(id) ON DELETE CASCADE NOT NULL,
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    growth_score INTEGER CHECK (growth_score >= 0 AND growth_score <= 100),
    conversion_score INTEGER CHECK (conversion_score >= 0 AND conversion_score <= 100),
    engagement_score INTEGER CHECK (engagement_score >= 0 AND engagement_score <= 100),
    retention_score INTEGER CHECK (retention_score >= 0 AND retention_score <= 100),
    revenue_score INTEGER CHECK (revenue_score >= 0 AND revenue_score <= 100),
    metadata JSONB DEFAULT '{}'::jsonb,
    calculated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_initiative_health_scores_initiative_id ON public.initiative_health_scores(initiative_id);
CREATE INDEX IF NOT EXISTS idx_initiative_health_scores_calculated_at ON public.initiative_health_scores(calculated_at);

-- 2. Enhance Profiles for Lifecycle Tracking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_engagement_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Registered User';

-- 3. Health Score Heuristic Function
CREATE OR REPLACE FUNCTION public.calculate_initiative_health(p_initiative_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_growth_score INTEGER;
    v_conversion_score INTEGER;
    v_engagement_score INTEGER;
    v_retention_score INTEGER;
    v_revenue_score INTEGER;
    v_total_health INTEGER;
    v_stats RECORD;
BEGIN
    -- Get latest stats (last 7 days average)
    SELECT
        COALESCE(AVG(view_count), 0) as avg_views,
        COALESCE(AVG(registration_count), 0) as avg_reg,
        COALESCE(AVG(successful_payment_count), 0) as avg_payments,
        COALESCE(SUM(total_revenue_mur), 0) as total_rev
    INTO v_stats
    FROM public.daily_initiative_stats
    WHERE initiative_id = p_initiative_id
    AND date >= CURRENT_DATE - INTERVAL '7 days';

    v_growth_score := 70; -- Baseline

    IF v_stats.avg_views > 0 THEN
        v_conversion_score := LEAST((v_stats.avg_reg * 100.0 / v_stats.avg_views) * 5, 100);
    ELSE
        v_conversion_score := 50;
    END IF;

    v_engagement_score := 65;

    SELECT
        CASE
            WHEN COUNT(*) = 0 THEN 0
            ELSE LEAST((COUNT(CASE WHEN status = 'active' THEN 1 END) * 100 / COUNT(*)), 100)
        END
    INTO v_retention_score
    FROM public.subscriptions s
    JOIN public.member_preferences mp ON s.user_id = mp.user_id
    WHERE mp.initiative_id = p_initiative_id;

    v_revenue_score := 75;

    v_total_health := (
        v_growth_score * 0.2 +
        v_conversion_score * 0.2 +
        v_engagement_score * 0.2 +
        v_retention_score * 0.2 +
        v_revenue_score * 0.2
    )::INTEGER;

    RETURN jsonb_build_object(
        'health_score', v_total_health,
        'growth_score', v_growth_score,
        'conversion_score', v_conversion_score,
        'engagement_score', v_engagement_score,
        'retention_score', v_retention_score,
        'revenue_score', v_revenue_score
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Daily Health Snapshot Procedure
CREATE OR REPLACE FUNCTION public.snapshot_initiative_health()
RETURNS VOID AS $$
DECLARE
    rec RECORD;
    v_scores JSONB;
BEGIN
    FOR rec IN SELECT id FROM public.initiatives WHERE status = 'active' LOOP
        v_scores := public.calculate_initiative_health(rec.id);

        INSERT INTO public.initiative_health_scores (
            initiative_id,
            health_score,
            growth_score,
            conversion_score,
            engagement_score,
            retention_score,
            revenue_score,
            calculated_at
        ) VALUES (
            rec.id,
            (v_scores->>'health_score')::INTEGER,
            (v_scores->>'growth_score')::INTEGER,
            (v_scores->>'conversion_score')::INTEGER,
            (v_scores->>'engagement_score')::INTEGER,
            (v_scores->>'retention_score')::INTEGER,
            (v_scores->>'revenue_score')::INTEGER,
            now()
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. RLS for Health Scores
ALTER TABLE public.initiative_health_scores ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff can view own initiative health') THEN
        CREATE POLICY "Staff can view own initiative health"
        ON public.initiative_health_scores FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.initiatives i
                JOIN public.profiles p ON i.organization_id = p.organization_id
                WHERE i.id = initiative_health_scores.initiative_id AND p.id = auth.uid()
            ) OR (SELECT public.has_role('admin'))
        );
    END IF;
END $$;

-- 6. Trigger to update last_engagement_at
CREATE OR REPLACE FUNCTION public.update_last_engagement()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET last_engagement_at = now()
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
        DROP TRIGGER IF EXISTS trigger_update_last_engagement_activities ON public.activities;
        CREATE TRIGGER trigger_update_last_engagement_activities
        AFTER INSERT ON public.activities
        FOR EACH ROW
        EXECUTE FUNCTION public.update_last_engagement();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'initiative_events') THEN
        DROP TRIGGER IF EXISTS trigger_update_last_engagement_events ON public.initiative_events;
        CREATE TRIGGER trigger_update_last_engagement_events
        AFTER INSERT ON public.initiative_events
        FOR EACH ROW
        EXECUTE FUNCTION public.update_last_engagement();
    END IF;
END $$;


-- 7. Add lifecycle fields to leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS lead_stage TEXT DEFAULT 'Visitor',
ADD COLUMN IF NOT EXISTS utm_parameters JSONB DEFAULT '{}'::jsonb;

-- 8. Retention Analysis View
CREATE OR REPLACE VIEW public.supporter_retention_stats WITH (security_invoker = true) AS
SELECT
    p.organization_id,
    p.id as profile_id,
    p.full_name,
    p.lifecycle_stage,
    p.last_engagement_at,
    CASE
        WHEN p.last_engagement_at >= now() - INTERVAL '30 days' THEN 'Active'
        WHEN p.last_engagement_at >= now() - INTERVAL '90 days' THEN 'Dormant'
        ELSE 'Inactive'
    END as retention_status,
    COUNT(DISTINCT s.id) as active_subscriptions,
    SUM(pay.amount_mur) as total_lifetime_contribution
FROM public.profiles p
LEFT JOIN public.subscriptions s ON p.id = s.user_id AND s.status = 'active'
LEFT JOIN public.payments pay ON p.id = pay.user_id AND pay.status = 'success'
GROUP BY p.organization_id, p.id, p.full_name, p.lifecycle_stage, p.last_engagement_at;

-- 9. Momentum Trending Function
CREATE OR REPLACE FUNCTION public.get_trending_initiatives(p_limit INTEGER DEFAULT 6)
RETURNS TABLE (
    initiative_id UUID,
    momentum_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id,
        (
            COALESCE(SUM(CASE WHEN e.event_type = 'page_view' THEN 1 ELSE 0 END), 0) * 0.3 +
            COALESCE(SUM(CASE WHEN e.event_type = 'registration_conversion' THEN 1 ELSE 0 END), 0) * 0.7
        )::NUMERIC as score
    FROM public.initiatives i
    LEFT JOIN public.initiative_events e ON i.id = e.initiative_id AND e.created_at >= now() - INTERVAL '48 hours'
    WHERE i.status = 'active' AND i.is_published = true
    GROUP BY i.id
    ORDER BY score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 10. Enhance Aggregation Tables with Failed Payments
ALTER TABLE public.daily_initiative_stats
ADD COLUMN IF NOT EXISTS failed_payment_count INTEGER DEFAULT 0;

ALTER TABLE public.daily_campaign_stats
ADD COLUMN IF NOT EXISTS failed_payment_count INTEGER DEFAULT 0;

-- Update the aggregate_daily_stats function to track failures
CREATE OR REPLACE FUNCTION public.aggregate_daily_stats(p_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS VOID AS $$
BEGIN
    -- Initiative Stats
    INSERT INTO public.daily_initiative_stats (initiative_id, date, view_count, registration_count, subscription_count, successful_payment_count, total_revenue_mur, failed_payment_count)
    SELECT
        i.id,
        p_date,
        COUNT(CASE WHEN e.event_type = 'page_view' THEN 1 END),
        COUNT(CASE WHEN e.event_type = 'registration_conversion' THEN 1 END),
        COUNT(CASE WHEN e.event_type = 'subscription_started' THEN 1 END),
        COUNT(CASE WHEN e.event_type = 'payment_completed' THEN 1 END),
        COALESCE(SUM(CASE WHEN e.event_type = 'payment_completed' THEN (e.metadata->>'amount_mur')::NUMERIC ELSE 0 END), 0),
        COUNT(CASE WHEN e.event_type = 'payment_failed' THEN 1 END)
    FROM public.initiatives i
    LEFT JOIN public.initiative_events e ON i.id = e.initiative_id AND e.created_at::DATE = p_date
    GROUP BY i.id
    ON CONFLICT (initiative_id, date) DO UPDATE SET
        view_count = EXCLUDED.view_count,
        registration_count = EXCLUDED.registration_count,
        subscription_count = EXCLUDED.subscription_count,
        successful_payment_count = EXCLUDED.successful_payment_count,
        total_revenue_mur = EXCLUDED.total_revenue_mur,
        failed_payment_count = EXCLUDED.failed_payment_count;

    -- Campaign Stats
    INSERT INTO public.daily_campaign_stats (campaign_link_id, date, view_count, registration_count, subscription_count, successful_payment_count, total_revenue_mur, failed_payment_count)
    SELECT
        cl.id,
        p_date,
        COUNT(CASE WHEN e.event_type = 'page_view' THEN 1 END),
        COUNT(CASE WHEN e.event_type = 'registration_conversion' THEN 1 END),
        COUNT(CASE WHEN e.event_type = 'subscription_started' THEN 1 END),
        COUNT(CASE WHEN e.event_type = 'payment_completed' THEN 1 END),
        COALESCE(SUM(CASE WHEN e.event_type = 'payment_completed' THEN (e.metadata->>'amount_mur')::NUMERIC ELSE 0 END), 0),
        COUNT(CASE WHEN e.event_type = 'payment_failed' THEN 1 END)
    FROM public.campaign_links cl
    LEFT JOIN public.initiative_events e ON cl.id = e.campaign_link_id AND e.created_at::DATE = p_date
    GROUP BY cl.id
    ON CONFLICT (campaign_link_id, date) DO UPDATE SET
        view_count = EXCLUDED.view_count,
        registration_count = EXCLUDED.registration_count,
        subscription_count = EXCLUDED.subscription_count,
        successful_payment_count = EXCLUDED.successful_payment_count,
        total_revenue_mur = EXCLUDED.total_revenue_mur,
        failed_payment_count = EXCLUDED.failed_payment_count;

    -- Revenue Stats
    INSERT INTO public.daily_revenue_stats (date, total_revenue_mur, total_payments, failed_payments, active_subscriptions)
    SELECT
        p_date,
        COALESCE(SUM(CASE WHEN status = 'success' THEN amount_mur ELSE 0 END), 0),
        COUNT(CASE WHEN status = 'success' THEN 1 END),
        COUNT(CASE WHEN status = 'failed' THEN 1 END),
        (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active')
    FROM public.payments
    WHERE created_at::DATE = p_date
    ON CONFLICT (date) DO UPDATE SET
        total_revenue_mur = EXCLUDED.total_revenue_mur,
        total_payments = EXCLUDED.total_payments,
        failed_payments = EXCLUDED.failed_payments,
        active_subscriptions = EXCLUDED.active_subscriptions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
