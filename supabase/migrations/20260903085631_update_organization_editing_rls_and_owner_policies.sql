-- Drop existing update policy if any
DROP POLICY IF EXISTS "Org owners and admins can update organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organizations managed by staff or admins" ON public.organizations;

-- Create comprehensive update policy allowing admins and assigned owners to update organizations
CREATE POLICY "Org owners and admins can update organizations"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  has_role('admin'::app_role) 
  OR has_role('super_admin'::app_role)
  OR owner_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.organization_id = organizations.id
      AND p.id = auth.uid()
  )
)
WITH CHECK (
  has_role('admin'::app_role) 
  OR has_role('super_admin'::app_role)
  OR owner_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.organization_id = organizations.id
      AND p.id = auth.uid()
  )
);

-- Trigger to prevent non-admins from changing is_verified
CREATE OR REPLACE FUNCTION public.protect_organization_verification_flag()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.is_verified IS DISTINCT FROM OLD.is_verified) THEN
    IF NOT (has_role('admin'::app_role) OR has_role('super_admin'::app_role)) THEN
      RAISE EXCEPTION 'Only administrators can toggle organization verification status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_org_verification ON public.organizations;
CREATE TRIGGER trg_protect_org_verification
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.protect_organization_verification_flag();
