-- Fix: allow CommonGround admins (including super_admin) to manage initiatives.
--
-- The admin UI and server action already authenticate admins, but the server-side
-- Supabase client still uses the authenticated user's JWT, so initiatives remain
-- subject to RLS. The existing initiatives policies only allow organization staff
-- to mutate their own initiatives. This migration adds an explicit admin policy.
--
-- Cast role to text so this migration remains compatible with environments where
-- app_role was created before super_admin was introduced.

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
