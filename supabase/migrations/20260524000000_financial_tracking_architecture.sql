-- 1. Extend initiatives table
ALTER TABLE public.initiatives
ADD COLUMN IF NOT EXISTS is_system_owned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS monthly_target_mur NUMERIC DEFAULT 0;

-- 2. Create financial account types
DO $$ BEGIN
    CREATE TYPE public.financial_account_type AS ENUM (
        'platform',
        'organization_pool',
        'impact_pool',
        'fee',
        'initiative'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create financial_accounts table
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_type public.financial_account_type NOT NULL,
    reference_id UUID, -- initiative_id for 'initiative' type, null for system types
    cached_balance_mur NUMERIC DEFAULT 0 NOT NULL,
    is_system BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create fee configurations
DO $$ BEGIN
    CREATE TYPE public.fee_type AS ENUM ('percentage', 'fixed', 'hybrid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.fee_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_type public.fee_type NOT NULL,
    percentage_value NUMERIC,
    fixed_amount_mur NUMERIC,
    active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure only one active fee config
CREATE UNIQUE INDEX IF NOT EXISTS fee_configurations_active_idx ON public.fee_configurations (active) WHERE (active = true);

-- 5. Create billing cycles
CREATE TABLE IF NOT EXISTS public.billing_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    UNIQUE(month, year)
);

-- 6. Create initiative_funding_cycles
DO $$ BEGIN
    CREATE TYPE public.funding_cycle_status AS ENUM ('active', 'completed', 'underfunded', 'overflowed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.initiative_funding_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID REFERENCES public.initiatives(id) ON DELETE CASCADE NOT NULL,
    billing_cycle_id UUID REFERENCES public.billing_cycles(id) ON DELETE CASCADE NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    target_amount_mur NUMERIC DEFAULT 0 NOT NULL,
    received_amount_mur NUMERIC DEFAULT 0 NOT NULL,
    remaining_amount_mur NUMERIC DEFAULT 0 NOT NULL,
    overflow_amount_mur NUMERIC DEFAULT 0 NOT NULL,
    supporter_count INTEGER DEFAULT 0 NOT NULL,
    status public.funding_cycle_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(initiative_id, billing_cycle_id)
);

-- 7. Create financial_events (Ledger)
DO $$ BEGIN
    CREATE TYPE public.financial_event_type AS ENUM (
        'payment_received',
        'transaction_fee',
        'platform_share',
        'organization_pool',
        'allocation',
        'overflow',
        'impact_pool',
        'refund',
        'subscription_change',
        'payout'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.financial_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    billing_cycle_id UUID REFERENCES public.billing_cycles(id),
    user_id UUID REFERENCES auth.users(id),
    initiative_id UUID REFERENCES public.initiatives(id),
    account_id UUID REFERENCES public.financial_accounts(id) NOT NULL,
    event_type public.financial_event_type NOT NULL,
    amount_mur NUMERIC NOT NULL,
    previous_balance NUMERIC NOT NULL,
    resulting_balance NUMERIC NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create payouts
DO $$ BEGIN
    CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'paid', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    amount_mur NUMERIC NOT NULL,
    status public.payout_status DEFAULT 'pending' NOT NULL,
    scheduled_date DATE,
    paid_date DATE,
    reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Initialize System Accounts
INSERT INTO public.financial_accounts (account_type, is_system, cached_balance_mur)
VALUES
('platform', true, 0),
('organization_pool', true, 0),
('impact_pool', true, 0),
('fee', true, 0)
ON CONFLICT DO NOTHING;

-- 10. Initialize Financial Accounts for existing initiatives
INSERT INTO public.financial_accounts (account_type, reference_id, is_system)
SELECT 'initiative', id, false
FROM public.initiatives
WHERE id NOT IN (SELECT reference_id FROM public.financial_accounts WHERE reference_id IS NOT NULL);

-- 11. Initial Fee Configuration
INSERT INTO public.fee_configurations (fee_type, percentage_value, fixed_amount_mur, active)
VALUES ('hybrid', 3.5, 10, true)
ON CONFLICT DO NOTHING;

-- 12. RLS Policies
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiative_funding_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Helpers for RLS
CREATE OR REPLACE FUNCTION public.has_role(requested_role public.app_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = requested_role
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Policies
CREATE POLICY "Admins can manage financial accounts" ON public.financial_accounts FOR ALL USING (public.has_role('admin'));
CREATE POLICY "Admins can manage fee configurations" ON public.fee_configurations FOR ALL USING (public.has_role('admin'));
CREATE POLICY "Admins can manage billing cycles" ON public.billing_cycles FOR ALL USING (public.has_role('admin'));
CREATE POLICY "Admins can manage funding cycles" ON public.initiative_funding_cycles FOR ALL USING (public.has_role('admin'));
CREATE POLICY "Admins can manage financial events" ON public.financial_events FOR ALL USING (public.has_role('admin'));
CREATE POLICY "Admins can manage payouts" ON public.payouts FOR ALL USING (public.has_role('admin'));

CREATE POLICY "Users can view own financial events" ON public.financial_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view billing cycles" ON public.billing_cycles FOR SELECT USING (true);
CREATE POLICY "Anyone can view funding cycles" ON public.initiative_funding_cycles FOR SELECT USING (true);

-- 13. Immutability trigger
CREATE OR REPLACE FUNCTION public.check_financial_event_immutability()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Financial events are immutable and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS financial_events_immutable_update ON public.financial_events;
CREATE TRIGGER financial_events_immutable_update
BEFORE UPDATE ON public.financial_events
FOR EACH ROW EXECUTE FUNCTION public.check_financial_event_immutability();

DROP TRIGGER IF EXISTS financial_events_immutable_delete ON public.financial_events;
CREATE TRIGGER financial_events_immutable_delete
BEFORE DELETE ON public.financial_events
FOR EACH ROW EXECUTE FUNCTION public.check_financial_event_immutability();
