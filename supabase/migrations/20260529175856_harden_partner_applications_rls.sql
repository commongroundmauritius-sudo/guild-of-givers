-- 1. Enable RLS
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_application_activity ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Anyone can submit partner applications" ON public.partner_applications;
DROP POLICY IF EXISTS "Admins can manage partner applications" ON public.partner_applications;
DROP POLICY IF EXISTS "Admins can manage partner application activity" ON public.partner_application_activity;

-- 3. Create hardened policies for partner_applications

-- Public INSERT: Only allow specific fields
-- Note: We use WITH CHECK (true) but the RLS will block fields not explicitly permitted if they are not NULL and have no default.
-- Actually, in Supabase RLS, if a user attempts to insert a column they don't have permission for, it might still succeed if the policy is broad.
-- To restrict columns, we would ideally use column-level grants, but for RLS we stick to role-based access.
-- The prompt explicitly asked for a policy allowing 'TO anon, authenticated' for INSERT.
CREATE POLICY "Public can submit partner applications"
ON public.partner_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
    -- Ensure they are not trying to set administrative fields
    reviewed_by IS NULL AND
    reviewed_at IS NULL AND
    converted_by IS NULL AND
    converted_at IS NULL AND
    converted_organization_id IS NULL AND
    admin_notes IS NULL AND
    status = 'submitted'::partner_application_status
);

-- Admin ALL access
CREATE POLICY "Admins can manage partner applications"
ON public.partner_applications
FOR ALL
TO authenticated
USING (
    has_role('admin'::public.app_role) OR 
    has_role('super_admin'::public.app_role)
)
WITH CHECK (
    has_role('admin'::public.app_role) OR 
    has_role('super_admin'::public.app_role)
);

-- 4. Create hardened policies for partner_application_activity
CREATE POLICY "Admins can manage partner application activity"
ON public.partner_application_activity
FOR ALL
TO authenticated
USING (
    has_role('admin'::public.app_role) OR 
    has_role('super_admin'::public.app_role)
)
WITH CHECK (
    has_role('admin'::public.app_role) OR 
    has_role('super_admin'::public.app_role)
);

-- Also allow the system (via triggers) to insert activity, 
-- but since triggers run as SECURITY DEFINER or as the user, 
-- and our triggers are SECURITY DEFINER, they bypass RLS anyway if they don't use the user's session.
-- Actually, triggers bypass RLS by default.

-- 5. Revoke direct access to ensure only RLS/Functions can touch the table if needed
-- (Optional, but let's stick to the requested RLS policies)

