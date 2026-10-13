-- The legacy ALL policy lets organization-linked users reach INSERT and DELETE
-- policy paths that are not part of the intended organization-management model.
-- Keep the explicit authenticated UPDATE policy for owners/staff and the separate
-- authenticated admin ALL policy as the supported access paths.
DROP POLICY IF EXISTS "Organization staff can manage their organization" ON public.organizations;
