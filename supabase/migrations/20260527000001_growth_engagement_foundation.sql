-- Growth Optimization & Engagement Layer Foundation

-- 1. Email Queue Architecture
CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient TEXT NOT NULL,
    template_key TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'sent', 'failed'
    retry_count INTEGER DEFAULT 0 NOT NULL,
    error_message TEXT,
    provider TEXT, -- e.g., 'sendgrid', 'resend'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    processed_at TIMESTAMPTZ
);

-- 2. Notifications Expansion
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Financial Reliability Expansion
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS gateway_response JSONB,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS reconciliation_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS webhook_event_id TEXT;

ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMPTZ;

-- 4. Attribution & Event Expansion
ALTER TABLE public.initiative_events
ADD COLUMN IF NOT EXISTS campaign_link_id UUID REFERENCES public.campaign_links(id) ON DELETE SET NULL;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS campaign_link_id UUID REFERENCES public.campaign_links(id) ON DELETE SET NULL;

-- 5. Aggregation Tables
CREATE TABLE IF NOT EXISTS public.daily_initiative_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID REFERENCES public.initiatives(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    view_count INTEGER DEFAULT 0,
    registration_count INTEGER DEFAULT 0,
    subscription_count INTEGER DEFAULT 0,
    successful_payment_count INTEGER DEFAULT 0,
    total_revenue_mur DECIMAL DEFAULT 0,
    UNIQUE(initiative_id, date)
);

CREATE TABLE IF NOT EXISTS public.daily_campaign_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_link_id UUID REFERENCES public.campaign_links(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    view_count INTEGER DEFAULT 0,
    registration_count INTEGER DEFAULT 0,
    subscription_count INTEGER DEFAULT 0,
    successful_payment_count INTEGER DEFAULT 0,
    total_revenue_mur DECIMAL DEFAULT 0,
    UNIQUE(campaign_link_id, date)
);

CREATE TABLE IF NOT EXISTS public.daily_revenue_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    total_revenue_mur DECIMAL DEFAULT 0,
    total_payments INTEGER DEFAULT 0,
    failed_payments INTEGER DEFAULT 0,
    active_subscriptions INTEGER DEFAULT 0
);

-- 6. Campaign Link Enhancements
ALTER TABLE public.campaign_links
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 7. RLS Enforcement
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_initiative_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_campaign_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_revenue_stats ENABLE ROW LEVEL SECURITY;

-- Email Queue: Only admins can read/manage
CREATE POLICY "Admins can manage email_queue"
ON public.email_queue FOR ALL
TO authenticated
USING (public.has_role('admin'));

-- Aggregation Tables: Organization staff can view their own, admins all
CREATE POLICY "Staff can view own initiative stats"
ON public.daily_initiative_stats FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.initiatives i
        JOIN public.profiles p ON i.organization_id = p.organization_id
        WHERE i.id = daily_initiative_stats.initiative_id AND p.id = auth.uid()
    ) OR public.has_role('admin')
);

CREATE POLICY "Staff can view own campaign stats"
ON public.daily_campaign_stats FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.campaign_links cl
        JOIN public.initiatives i ON cl.initiative_id = i.id
        JOIN public.profiles p ON i.organization_id = p.organization_id
        WHERE cl.id = daily_campaign_stats.campaign_link_id AND p.id = auth.uid()
    ) OR public.has_role('admin')
);

CREATE POLICY "Admins can view revenue stats"
ON public.daily_revenue_stats FOR SELECT
TO authenticated
USING (public.has_role('admin'));

-- 8. Idempotent Aggregation Function
CREATE OR REPLACE FUNCTION public.aggregate_daily_stats(p_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS VOID AS $$
BEGIN
    -- Initiative Stats
    INSERT INTO public.daily_initiative_stats (initiative_id, date, view_count, registration_count, subscription_count, successful_payment_count, total_revenue_mur)
    SELECT
        i.id,
        p_date,
        COUNT(CASE WHEN e.event_type = 'page_view' THEN 1 END),
        COUNT(CASE WHEN e.event_type = 'registration_conversion' THEN 1 END),
        COUNT(CASE WHEN e.event_type = 'subscription_started' THEN 1 END),
        COUNT(CASE WHEN e.event_type = 'payment_completed' THEN 1 END),
        COALESCE(SUM(CASE WHEN e.event_type = 'payment_completed' THEN (e.metadata->>'amount_mur')::NUMERIC ELSE 0 END), 0)
    FROM public.initiatives i
    LEFT JOIN public.initiative_events e ON i.id = e.initiative_id AND e.created_at::DATE = p_date
    GROUP BY i.id
    ON CONFLICT (initiative_id, date) DO UPDATE SET
        view_count = EXCLUDED.view_count,
        registration_count = EXCLUDED.registration_count,
        subscription_count = EXCLUDED.subscription_count,
        successful_payment_count = EXCLUDED.successful_payment_count,
        total_revenue_mur = EXCLUDED.total_revenue_mur;

    -- Campaign Stats
    INSERT INTO public.daily_campaign_stats (campaign_link_id, date, view_count, registration_count, subscription_count, successful_payment_count, total_revenue_mur)
    SELECT
        cl.id,
        p_date,
        COUNT(CASE WHEN e.event_type = 'page_view' THEN 1 END),
        COUNT(CASE WHEN e.event_type = 'registration_conversion' THEN 1 END),
        COUNT(CASE WHEN e.event_type = 'subscription_started' THEN 1 END),
        COUNT(CASE WHEN e.event_type = 'payment_completed' THEN 1 END),
        COALESCE(SUM(CASE WHEN e.event_type = 'payment_completed' THEN (e.metadata->>'amount_mur')::NUMERIC ELSE 0 END), 0)
    FROM public.campaign_links cl
    LEFT JOIN public.initiative_events e ON cl.id = e.campaign_link_id AND e.created_at::DATE = p_date
    GROUP BY cl.id
    ON CONFLICT (campaign_link_id, date) DO UPDATE SET
        view_count = EXCLUDED.view_count,
        registration_count = EXCLUDED.registration_count,
        subscription_count = EXCLUDED.subscription_count,
        successful_payment_count = EXCLUDED.successful_payment_count,
        total_revenue_mur = EXCLUDED.total_revenue_mur;

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
