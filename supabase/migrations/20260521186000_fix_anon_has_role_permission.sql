-- Fix permission issue where 'anon' role cannot execute 'has_role' function
-- This was causing 401 errors on the homepage because RLS policies for
-- initiatives and organizations rely on this function.

GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO anon;

-- Ensure it's also explicitly granted to authenticated (redundant but safe)
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;

-- Ensure public schema usage is granted (usually default but critical for anon)
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
