-- Fix for SSR homepage 500 errors
-- Restores EXECUTE permission on has_role for the anon role, which is required for public RLS policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'has_role' AND n.nspname = 'public') THEN
        GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO anon;
        GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;
    END IF;
END $$;
