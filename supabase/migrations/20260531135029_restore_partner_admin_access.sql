-- Restore Admin Access to Partner Applications
-- Migration 20260607000000 revoked SELECT and INSERT from anon/authenticated 
-- to force use of RPC for submissions. However, the Admin dashboard needs 
-- SELECT and UPDATE access (protected by RLS) to manage applications.

-- 1. Restore privileges for partner_applications
-- RLS policies already protect these tables, so granting access is safe.
GRANT SELECT, UPDATE ON public.partner_applications TO authenticated;
GRANT SELECT ON public.partner_application_activity TO authenticated;

-- 2. Restore INSERT for public submissions
GRANT INSERT ON public.partner_applications TO anon, authenticated;

