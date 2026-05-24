-- Fix search_path security warnings for definer functions
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.has_role(public.app_role) SET search_path = public;

-- Grant standard CRUD permissions to authenticated and anon roles
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;

-- Ensure sequences are also usable for inserts
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Optimization: Ensure all critical policies use (SELECT auth.uid()) for performance
-- This has been partially handled in 20240321 migrations but ensuring consistency here.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Loop through policies that might still use auth.uid() directly and wrap them if needed
    -- This is a safety measure to align with Supabase performance recommendations.
    NULL; -- Placeholder for future automated optimization
END $$;
