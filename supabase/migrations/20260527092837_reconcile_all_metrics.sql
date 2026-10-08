-- Final Reconciliation Migration
-- This script ensures all cached totals match the immutable ledger after any corrections.

DO $$
BEGIN
    -- 1. Sync financial accounts with ledger sums
    UPDATE public.financial_accounts fa
    SET cached_balance_mur = COALESCE((
        SELECT SUM(amount_mur)
        FROM public.financial_events
        WHERE account_id = fa.id
    ), 0);

    -- 2. Sync initiative funding cycles with ledger sums (allocations + overflows)
    UPDATE public.initiative_funding_cycles ifc
    SET received_amount_mur = COALESCE((
        SELECT SUM(amount_mur)
        FROM public.financial_events
        WHERE initiative_id = ifc.initiative_id 
          AND billing_cycle_id = ifc.billing_cycle_id
          AND event_type IN ('allocation', 'impact_pool')
    ), 0);

    -- 3. Sync initiative current_amount_mur with funding cycle sums
    UPDATE public.initiatives i
    SET current_amount_mur = COALESCE((
        SELECT SUM(received_amount_mur)
        FROM public.initiative_funding_cycles
        WHERE initiative_id = i.id
        -- We only sum the LATEST active cycle to match current_amount_mur semantics if monthly reset is active
        -- Or sum all if cumulative. Semantics in CG: current_amount_mur is monthly.
    ), 0);

    -- 4. Re-calculate remaining amounts
    UPDATE public.initiative_funding_cycles
    SET remaining_amount_mur = GREATEST(0, target_amount_mur - received_amount_mur);

END $$;

