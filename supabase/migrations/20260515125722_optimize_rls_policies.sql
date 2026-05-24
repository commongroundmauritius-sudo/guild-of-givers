-- Optimize RLS policies by wrapping auth.uid() in a subquery

BEGIN;

-- Allocations
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

-- Reports
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
        DROP POLICY IF EXISTS "NGO staff can manage their own NGO reports" ON public.reports;
        -- Check if it's ngo_id or organization_id
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'ngo_id') THEN
            CREATE POLICY "NGO staff can manage their own NGO reports" ON public.reports
            FOR ALL USING (
              ngo_id IN (
                SELECT ngo_id FROM public.profiles
                WHERE id = (SELECT auth.uid())
              )
            );
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'organization_id') THEN
            CREATE POLICY "Organization staff can manage their own reports" ON public.reports
            FOR ALL USING (
              organization_id IN (
                SELECT organization_id FROM public.profiles
                WHERE id = (SELECT auth.uid())
              )
            );
        END IF;
    END IF;
END $$;

-- Initiatives
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'initiatives') THEN
        DROP POLICY IF EXISTS "NGO staff can manage own initiatives" ON public.initiatives;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'ngo_id') THEN
            CREATE POLICY "NGO staff can manage own initiatives" ON public.initiatives
            FOR ALL USING (
              EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = (SELECT auth.uid())
                AND profiles.ngo_id = initiatives.ngo_id
              )
            );
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'organization_id') THEN
            CREATE POLICY "Organization staff can manage own initiatives" ON public.initiatives
            FOR ALL USING (
              EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = (SELECT auth.uid())
                AND profiles.organization_id = initiatives.organization_id
              )
            );
        END IF;
    END IF;
END $$;

-- Leads
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
        DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads;
        CREATE POLICY "Admins can manage leads" ON public.leads
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = (SELECT auth.uid())
            AND user_roles.role = 'admin'::app_role
          )
        );
    END IF;
END $$;

-- Admin Actions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_actions') THEN
        DROP POLICY IF EXISTS "Admins can view all actions" ON public.admin_actions;
        CREATE POLICY "Admins can view all actions" ON public.admin_actions
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = (SELECT auth.uid())
            AND user_roles.role = 'admin'::app_role
          )
        );

        DROP POLICY IF EXISTS "Admins can insert actions" ON public.admin_actions;
        CREATE POLICY "Admins can insert actions" ON public.admin_actions
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = (SELECT auth.uid())
            AND user_roles.role = 'admin'::app_role
          )
        );
    END IF;
END $$;

COMMIT;
