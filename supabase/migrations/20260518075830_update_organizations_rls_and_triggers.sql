-- Update Organizations RLS
-- Runs AFTER the rename

-- 1. Clean up old NGO policies
DROP POLICY IF EXISTS "Public view NGOs" ON public.organizations;
DROP POLICY IF EXISTS "Optimized public view NGOs" ON public.organizations;

-- 2. New Organization policies
DROP POLICY IF EXISTS "Public view policy" ON public.organizations;
CREATE POLICY "Public view policy" ON public.organizations
FOR SELECT USING (is_verified = true OR status = 'active');

DROP POLICY IF EXISTS "Organization owner management" ON public.organizations;
CREATE POLICY "Organization owner management" ON public.organizations
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.organization_id = organizations.id
        AND profiles.id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admin management policy" ON public.organizations;
CREATE POLICY "Admin management policy" ON public.organizations
FOR ALL USING (public.has_role('admin'));

-- 3. Update initiatives and reports policies for the new column name
DROP POLICY IF EXISTS "NGO management policy" ON public.initiatives;
CREATE POLICY "Organization management policy" ON public.initiatives
FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

DROP POLICY IF EXISTS "NGO staff can manage their own NGO reports" ON public.reports;
CREATE POLICY "Organization management policy" ON public.reports
FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);
