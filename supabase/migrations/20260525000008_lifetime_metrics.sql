-- Lifetime Metrics Support
-- Resolves [P2-007]

BEGIN;

ALTER TABLE public.initiatives
ADD COLUMN IF NOT EXISTS lifetime_received_mur NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS lifetime_supporters INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lifetime_allocations INTEGER DEFAULT 0;

-- Function to sync lifetime metrics from ledger
CREATE OR REPLACE FUNCTION public.sync_initiative_lifetime_metrics(p_initiative_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.initiatives
    SET
        lifetime_received_mur = (
            SELECT COALESCE(SUM(amount_mur), 0)
            FROM public.financial_events
            WHERE initiative_id = p_initiative_id
            AND event_type IN ('initiative_allocation', 'impact_pool', 'allocation')
        ),
        lifetime_supporters = (
            SELECT COUNT(DISTINCT user_id)
            FROM public.financial_events
            WHERE initiative_id = p_initiative_id
            AND event_type IN ('initiative_allocation', 'impact_pool', 'allocation')
        ),
        lifetime_allocations = (
            SELECT COUNT(*)
            FROM public.financial_events
            WHERE initiative_id = p_initiative_id
            AND event_type IN ('initiative_allocation', 'impact_pool', 'allocation')
        )
    WHERE id = p_initiative_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
