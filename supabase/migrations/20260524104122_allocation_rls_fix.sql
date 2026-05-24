-- Ensure Admins can see all allocations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'allocations') THEN
        DROP POLICY IF EXISTS "Admins can view all allocations" ON public.allocations;
        CREATE POLICY "Admins can view all allocations" ON public.allocations
        FOR SELECT USING (public.has_role('admin'));
    END IF;
END $$;

-- Ensure Admins can see all member preferences (for priority distribution)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'member_preferences') THEN
        DROP POLICY IF EXISTS "Admins can view all member preferences" ON public.member_preferences;
        CREATE POLICY "Admins can view all member preferences" ON public.member_preferences
        FOR SELECT USING (public.has_role('admin'));
    END IF;
END $$;
