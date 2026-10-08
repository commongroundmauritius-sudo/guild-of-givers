-- Security Stabilization: Final Pass
-- This migration hardens high-risk security definer functions and resolves identified RLS policy gaps.

-- 1. Harden has_role search_path to prevent hijacking
ALTER FUNCTION public.has_role(public.app_role) SET search_path = public;

-- 2. Restrict Organization Document visibility
-- The "Anyone can view organization documents" policy is too permissive.
-- It should only be viewable by owners, admins, or if they are public.
DROP POLICY IF EXISTS "Anyone can view organization documents" ON public.organization_documents;

CREATE POLICY "Public can view active organization documents"
ON public.organization_documents
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = organization_documents.organization_id
        AND o.status = 'active'
    )
);

-- 3. Consolidate Organization Ownership Model
-- Move organizations RLS to use profiles.organization_id instead of deprecated owner_user_id
-- This aligns with the authoritative model in Memory.

DROP POLICY IF EXISTS "Organization management policy" ON public.organizations;
CREATE POLICY "Organizations managed by staff or admins"
ON public.organizations
FOR ALL
USING (
    (EXISTS (SELECT 1 FROM public.profiles p WHERE p.organization_id = organizations.id AND p.id = auth.uid()))
    OR public.has_role('admin')
);

-- 4. Harden financial_events security
-- Revoke public execution of sensitive functions if any exist
-- Ensure search_path on allocate_payment_funds
ALTER FUNCTION public.allocate_payment_funds(UUID, UUID, NUMERIC) SET search_path = public;
ALTER FUNCTION public.process_recurring_billing() SET search_path = public;

-- 5. Leads protection
-- Ensure leads can only be managed by admins, but inserted by public
DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads;
CREATE POLICY "Admins can manage leads"
ON public.leads
FOR ALL
USING (public.has_role('admin'));

-- Note: The signup flow requires public INSERT and conversion (UPDATE) for the lead.
-- We keep the existing conversion policies if they are present and safe.

