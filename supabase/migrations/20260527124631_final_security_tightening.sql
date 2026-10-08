-- Final Security Tightening
-- Resolving overly permissive public policies on internal/sensitive tables.

-- 1. Tighten Reports visibility
-- Impact reports should be public, but let's ensure we only show those intended for public.
-- Currently 'true' is set for SELECT. We'll refine it to ensure they are linked to active initiatives.
DROP POLICY IF EXISTS "Anyone can view reports" ON public.reports;
CREATE POLICY "Anyone can view reports for active initiatives"
ON public.reports
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.initiatives i
        WHERE i.id = reports.initiative_id
        AND i.is_published = true
        AND i.is_approved = true
    )
    OR (organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid()))
    OR public.has_role('admin')
);

-- 2. Tighten Leads conversion policy
-- Currently 'true' for UPDATE. We need to restrict this to only allow updating specific status fields
-- and only if the lead is not already converted/abandoned.
DROP POLICY IF EXISTS "Public can update own lead for conversion" ON public.leads;
CREATE POLICY "Public can update lead during onboarding"
ON public.leads
FOR UPDATE
USING (status = 'started')
WITH CHECK (status IN ('converted', 'abandoned', 'started'));

-- 3. Billing and Funding Cycles
-- Public viewing is fine for transparency, but let's ensure it's limited to SELECT.
-- (Already limited to SELECT in pg_policies output).

-- 4. Initiatives: Ensure organizations can only manage their own
DROP POLICY IF EXISTS "Organizations can manage own initiatives" ON public.initiatives;
CREATE POLICY "Organizations can manage own initiatives"
ON public.initiatives
FOR ALL
USING (
    (organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid()))
    OR public.has_role('admin')
);

