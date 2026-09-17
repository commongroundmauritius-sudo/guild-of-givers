-- Keep the development-only mock membership completion RPC out of the public API surface.
-- Mock membership completion is intended for local/test builds only; production
-- membership activation must be performed by the real payment integration/server flow.
REVOKE EXECUTE ON FUNCTION public.dev_complete_mock_membership(numeric, integer, boolean, text, uuid[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.dev_complete_mock_membership(numeric, integer, boolean, text, uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.dev_complete_mock_membership(numeric, integer, boolean, text, uuid[]) FROM authenticated;
