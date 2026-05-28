-- Financial Tracking Architecture v1: Tables and Core Schema
-- Part of [P1-002] Financial Audit Trail

-- 1. Financial Accounts (Platform, Org Pool, Initiatives)
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL, -- platform, organization_pool, impact_pool, fee, initiative
    reference_id UUID, -- initiative_id or null for system accounts
    cached_balance_mur NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Fee Configuration
CREATE TABLE IF NOT EXISTS public.fee_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_type TEXT NOT NULL DEFAULT 'percentage', -- fixed, percentage, hybrid
    percentage_value NUMERIC DEFAULT 0,
    fixed_amount_mur NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Billing Cycles (Monthly)
CREATE TABLE IF NOT EXISTS public.billing_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'active', -- active, closed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(month, year)
);

-- 4. Initiative Funding Cycles (Monthly targets/received)
CREATE TABLE IF NOT EXISTS public.initiative_funding_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
    billing_cycle_id UUID NOT NULL REFERENCES public.billing_cycles(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    target_amount_mur NUMERIC DEFAULT 0,
    received_amount_mur NUMERIC DEFAULT 0,
    remaining_amount_mur NUMERIC DEFAULT 0,
    supporter_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active', -- active, completed, overflow
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(initiative_id, billing_cycle_id)
);

-- 5. Financial Events (The Immutable Ledger)
CREATE TABLE IF NOT EXISTS public.financial_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id),
    billing_cycle_id UUID REFERENCES public.billing_cycles(id),
    user_id UUID REFERENCES auth.users(id),
    initiative_id UUID REFERENCES public.initiatives(id),
    account_id UUID NOT NULL REFERENCES public.financial_accounts(id),
    event_type public.financial_event_type NOT NULL, -- payment_received, transaction_fee, platform_share, organization_pool, allocation, impact_pool, overflow, payout
    amount_mur NUMERIC NOT NULL,
    previous_balance NUMERIC NOT NULL,
    resulting_balance NUMERIC NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Payouts (To Organizations)
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    amount_mur NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, processed, failed
    processed_at TIMESTAMP WITH TIME ZONE,
    evidence_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiative_funding_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- 7. Policies (Guarded)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_accounts') THEN
        CREATE POLICY "Admins can manage financial accounts" ON public.financial_accounts FOR ALL USING (public.has_role('admin'));
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fee_configurations') THEN
        CREATE POLICY "Admins can manage fee configurations" ON public.fee_configurations FOR ALL USING (public.has_role('admin'));
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_cycles') THEN
        CREATE POLICY "Admins can manage billing cycles" ON public.billing_cycles FOR ALL USING (public.has_role('admin'));
        CREATE POLICY "Anyone can view billing cycles" ON public.billing_cycles FOR SELECT USING (true);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'initiative_funding_cycles') THEN
        CREATE POLICY "Admins can manage funding cycles" ON public.initiative_funding_cycles FOR ALL USING (public.has_role('admin'));
        CREATE POLICY "Anyone can view funding cycles" ON public.initiative_funding_cycles FOR SELECT USING (true);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_events') THEN
        CREATE POLICY "Admins can manage financial events" ON public.financial_events FOR ALL USING (public.has_role('admin'));
        CREATE POLICY "Users can view own financial events" ON public.financial_events FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payouts') THEN
        CREATE POLICY "Admins can manage payouts" ON public.payouts FOR ALL USING (public.has_role('admin'));
    END IF;
END $$;

-- 8. Seed Fee Config if empty
INSERT INTO public.fee_configurations (fee_type, percentage_value, fixed_amount_mur)
SELECT 'percentage', 0, 0
WHERE NOT EXISTS (SELECT 1 FROM public.fee_configurations);
