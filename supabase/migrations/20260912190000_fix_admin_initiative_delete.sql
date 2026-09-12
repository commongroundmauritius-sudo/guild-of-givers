-- Allow CommonGround admins (including super_admin) to manage initiatives.
-- The authenticated server-side client is still subject to RLS, so the policy
-- must explicitly grant admin/super_admin access.

BEGIN;

DROP POLICY IF EXISTS "Admins can manage all initiatives" ON public.initiatives;

CREATE POLICY "Admins can manage all initiatives"
ON public.initiatives
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role::text IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role::text IN ('admin', 'super_admin')
  )
);

COMMIT;
