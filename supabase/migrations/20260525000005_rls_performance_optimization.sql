-- RLS Performance Optimization
-- Resolved [P2-005]

BEGIN;

-- 1. Financial Events
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_events') THEN
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_events') THEN
                DROP POLICY IF EXISTS "Members can view own payment events" ON public.financial_events;
                CREATE POLICY "Members can view own payment events" ON public.financial_events
                FOR SELECT USING ((SELECT auth.uid()) = user_id);
    END IF;
END $$;
    END IF;
END $$;

-- 2. Allocations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'allocations') THEN
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'allocations') THEN
                DROP POLICY IF EXISTS "Users can view own allocations" ON public.allocations;
                CREATE POLICY "Users can view own allocations" ON public.allocations
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM public.payments
                        WHERE payments.id = allocations.payment_id
                        AND payments.user_id = (SELECT auth.uid())
                    )
                );
    END IF;
END $$;
    END IF;
END $$;

-- 3. Subscriptions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
                DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
                CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
                FOR SELECT USING ((SELECT auth.uid()) = user_id);

                DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
                CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
                FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
    END IF;
END $$;
    END IF;
END $$;

-- 4. Payments
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
                DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
                CREATE POLICY "Users can view own payments" ON public.payments
                FOR SELECT USING ((SELECT auth.uid()) = user_id);
    END IF;
END $$;
    END IF;
END $$;

COMMIT;
