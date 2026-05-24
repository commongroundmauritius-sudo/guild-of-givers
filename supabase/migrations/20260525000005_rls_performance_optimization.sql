-- RLS Performance Optimization
-- Resolved [P2-005]

BEGIN;

-- 1. Financial Events
DROP POLICY IF EXISTS "Members can view own payment events" ON public.financial_events;
CREATE POLICY "Members can view own payment events" ON public.financial_events
FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- 2. Allocations
DROP POLICY IF EXISTS "Users can view own allocations" ON public.allocations;
CREATE POLICY "Users can view own allocations" ON public.allocations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.payments
        WHERE payments.id = allocations.payment_id
        AND payments.user_id = (SELECT auth.uid())
    )
);

-- 3. Subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- 4. Payments
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
FOR SELECT USING ((SELECT auth.uid()) = user_id);

COMMIT;
