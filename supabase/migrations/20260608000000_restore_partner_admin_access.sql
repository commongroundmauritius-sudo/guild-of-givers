-- Restore Admin Access to Partner Applications
-- Migration 20260607000000 revoked SELECT and INSERT from anon/authenticated
-- to force use of RPC for submissions. However, the Admin dashboard needs
-- SELECT and UPDATE access (protected by RLS) to manage applications.

DO $$
BEGIN
    -- 1. Restore privileges for partner_applications
    -- RLS policies already protect these tables, so granting access is safe.
    GRANT SELECT, UPDATE ON public.partner_applications TO authenticated;
    GRANT SELECT ON public.partner_application_activity TO authenticated;

    -- 2. Restore INSERT for public submissions (for non-RPC fallback if any,
    -- though RPC is preferred, some client code might still try direct insert).
    -- RPC bypasses RLS and permissions as it is SECURITY DEFINER,
    -- but direct SELECT from Admin UI is blocked without these grants.
    GRANT INSERT ON public.partner_applications TO anon, authenticated;

    -- Note: RLS policies for "Admins can manage partner applications"
    -- and "Anyone can submit partner applications" already exist and
    -- correctly use has_role('admin') OR has_role('super_admin').
END $$;
