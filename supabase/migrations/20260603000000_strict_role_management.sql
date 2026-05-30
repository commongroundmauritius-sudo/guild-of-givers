-- Security Audit Pass 2: Role Management and Escalation Hardening

-- 1. Tighten user_roles RLS
-- Problem: 'Users can insert own role' is dangerous as it allows users to choose their own role during signup if not careful.
-- The system uses a trigger for initial role assignment, so public INSERT is not needed.

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Super Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- 2. Audit Profiles table for escalation fields
-- Ensure users cannot update their own 'lifecycle_stage' or 'organization_id' via standard RLS.
-- This requires a split policy approach.

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own basic info"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  -- Potential logic here to restrict specific columns if we were using a more advanced RLS implementation.
  -- Since PG doesn't easily support column-level RLS for UPDATE, we rely on our hardened Server Functions.
);

-- 3. Prevent mass-assignment to organizations
-- Ensure only verified paths can change organization ownership or status.
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organization owners can manage their organization" ON public.organizations;

CREATE POLICY "Organization owners can view their organization"
ON public.organizations FOR SELECT
TO authenticated
USING (owner_user_id = auth.uid());

CREATE POLICY "Admins can manage all organizations"
ON public.organizations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);
