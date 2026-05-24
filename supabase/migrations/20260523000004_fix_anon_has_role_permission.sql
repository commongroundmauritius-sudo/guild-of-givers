-- Fix for SSR homepage 500 errors
-- Restores EXECUTE permission on has_role for the anon role, which is required for public RLS policies
DO $$
BEGIN
    GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO anon;
    GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;
END $$;
