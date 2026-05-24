-- Update Organizations RLS and add administrative triggers
-- This migration runs after the NGO -> Organization rename

DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can manage Organizations" ON public.organizations;
    DROP POLICY IF EXISTS "Organization management policy" ON public.organizations;
    DROP POLICY IF EXISTS "Optimized public view Organizations" ON public.organizations;

    -- 1. Public view (Consistency with previous logic)
    CREATE POLICY "Public view policy" ON public.organizations
    FOR SELECT USING (is_verified = true OR status = 'active');

    -- 2. Organization Management
    CREATE POLICY "Organization owner management" ON public.organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.organization_id = organizations.id
            AND profiles.id = auth.uid()
        )
    );

    -- 3. Admin Oversight
    CREATE POLICY "Admin management policy" ON public.organizations
    FOR ALL USING (public.has_role('admin'));
END $$;
