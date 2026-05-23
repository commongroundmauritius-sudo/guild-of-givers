-- 1. Create is_system_entity flag for organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS is_system_entity BOOLEAN DEFAULT false;

-- 2. Mark CommonGround Platform as a system entity
UPDATE public.organizations
SET is_system_entity = true,
    organization_name = 'CommonGround Platform'
WHERE organization_name = 'CommonGround Platform';

-- 3. Prevent modification of system entities via regular policies
DROP POLICY IF EXISTS "System entities are protected" ON public.organizations;
CREATE POLICY "System entities are protected" ON public.organizations
FOR UPDATE USING (
  (is_system_entity IS NOT TRUE) OR (public.has_role('admin'))
) WITH CHECK (
  (is_system_entity IS NOT TRUE) OR (public.has_role('admin'))
);

DROP POLICY IF EXISTS "System entities cannot be deleted" ON public.organizations;
CREATE POLICY "System entities cannot be deleted" ON public.organizations
FOR DELETE USING (
  (is_system_entity IS NOT TRUE)
);

-- 4. Mark is_system_owned for initiatives
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS is_system_owned BOOLEAN DEFAULT false;

-- 5. Mark Impact Pool as system owned
UPDATE public.initiatives
SET is_system_owned = true
WHERE is_impact_pool = true;

-- 6. Prevent NGOs from managing system owned initiatives
DROP POLICY IF EXISTS "System owned initiatives are protected" ON public.initiatives;
CREATE POLICY "System owned initiatives are protected" ON public.initiatives
FOR ALL USING (
  (is_system_owned IS NOT TRUE) OR (public.has_role('admin'))
) WITH CHECK (
  (is_system_owned IS NOT TRUE) OR (public.has_role('admin'))
);

-- 7. Ensure seed logic reuses existing platform org
CREATE OR REPLACE FUNCTION public.ensure_platform_org()
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id FROM public.organizations WHERE organization_name = 'CommonGround Platform' LIMIT 1;
    IF v_id IS NULL THEN
        INSERT INTO public.organizations (organization_name, status, is_verified, is_system_entity)
        VALUES ('CommonGround Platform', 'active', true, true)
        RETURNING id INTO v_id;
    END IF;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;
