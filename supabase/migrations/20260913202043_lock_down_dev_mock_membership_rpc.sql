REVOKE EXECUTE ON FUNCTION public.dev_complete_mock_membership(numeric, integer, boolean, text, uuid[]) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.dev_complete_mock_membership(numeric, integer, boolean, text, uuid[]) FROM anon;

COMMENT ON FUNCTION public.dev_complete_mock_membership(numeric, integer, boolean, text, uuid[]) IS 'Development-only mock membership finalizer. Not callable from the client in production; kept for controlled development/test tooling.';
