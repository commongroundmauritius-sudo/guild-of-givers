-- Secure leads table with appropriate RLS policies

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
        -- Anyone can insert a lead (signup form)
        DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
        CREATE POLICY "Anyone can insert leads" ON public.leads
        FOR INSERT WITH CHECK (true);

        -- Only admins can view or manage leads
        DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads;
        CREATE POLICY "Admins can manage leads" ON public.leads
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.user_roles
                WHERE user_id = (SELECT auth.uid())
                AND role = 'admin'::app_role
            )
        );
    END IF;
END $$;
