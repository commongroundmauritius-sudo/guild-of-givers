-- [P1-002] Create financial_event_type enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_event_type') THEN
        CREATE TYPE public.financial_event_type AS ENUM (
            'payment_received',
            'transaction_fee',
            'platform_share',
            'organization_pool',
            'allocation',
            'impact_pool',
            'overflow',
            'payout',
            'refund',
            'subscription_change'
        );
    END IF;
END $$;
