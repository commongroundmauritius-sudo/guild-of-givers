-- Update organizations RLS and triggers to use organization_id and owner check
BEGIN;

-- 1. Organizations RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view verified organizations" ON public.organizations;
CREATE POLICY "Anyone can view verified organizations" ON public.organizations
FOR SELECT USING (is_verified = true);

DROP POLICY IF EXISTS "Admins can manage organizations" ON public.organizations;
CREATE POLICY "Admins can manage organizations" ON public.organizations
FOR ALL USING (public.has_role('admin'));

DROP POLICY IF EXISTS "Organization owners can update their Organization" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update their organization" ON public.organizations;
CREATE POLICY "Organization staff can update their organization" ON public.organizations
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE organization_id = organizations.id AND id = auth.uid()
    )
);

-- 2. Initiatives RLS refinement
DROP POLICY IF EXISTS "Organization staff can manage own initiatives" ON public.initiatives;
CREATE POLICY "Organization staff can manage own initiatives" ON public.initiatives
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.organization_id = initiatives.organization_id
    )
);

COMMIT;
