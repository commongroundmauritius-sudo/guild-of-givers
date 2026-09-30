-- Fix public initiative reads so anonymous visitors do not evaluate privileged has_role() branches.
-- Keep public discovery, admin access, and organization ownership as separate policies.
BEGIN;

DROP POLICY IF EXISTS "Public can view published initiatives" ON public.initiatives;

CREATE POLICY "Public can view published initiatives"
ON public.initiatives
FOR SELECT
TO anon, authenticated
USING (
  is_approved = true
  AND is_published = true
);

CREATE POLICY "Admins can view all initiatives"
ON public.initiatives
FOR SELECT
TO authenticated
USING (
  has_role('admin'::app_role)
  OR has_role('super_admin'::app_role)
);

CREATE POLICY "Organization staff can view own initiatives"
ON public.initiatives
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.organization_id = initiatives.organization_id
  )
);

COMMIT;
