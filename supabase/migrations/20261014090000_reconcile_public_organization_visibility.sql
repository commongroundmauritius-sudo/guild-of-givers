-- Reconcile production drift from the earlier public-organization visibility migration.
-- Historical migrations are immutable in deployed environments, so re-assert the intended
-- policy in a new forward-only migration.

DROP POLICY IF EXISTS "Anyone can view verified organizations" ON public.organizations;
DROP POLICY IF EXISTS "Public can view verified active organizations" ON public.organizations;

CREATE POLICY "Public can view verified active organizations"
ON public.organizations
FOR SELECT
TO anon, authenticated
USING (is_verified = true AND status = 'active');

-- Keep this migration deliberately narrow: organization staff write access and RPC grants
-- require separate caller/permission validation before any changes are made.
