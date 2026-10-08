-- Restore and Harden Admin/Service Permissions for CMS and CRM

-- 1. Grant Table Permissions
-- CMS
GRANT ALL ON public.homepage_versions TO authenticated, service_role;
GRANT SELECT ON public.homepage_versions TO anon;

-- CRM & Automation
GRANT ALL ON public.automation_rules TO authenticated, service_role;
GRANT ALL ON public.crm_tags TO authenticated, service_role;
GRANT ALL ON public.crm_tag_assignments TO authenticated, service_role;
GRANT ALL ON public.crm_notes TO authenticated, service_role;
GRANT ALL ON public.crm_tasks TO authenticated, service_role;

-- Financials
GRANT ALL ON public.financial_events TO authenticated, service_role;

-- Audit Logs
GRANT ALL ON public.audit_logs TO authenticated, service_role;

-- 2. Grant Sequence Permissions (Crucial for INSERTs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- 3. Harden Automation Rules Policy (Admin Only as requested)
DROP POLICY IF EXISTS "Orgs can manage their own automation rules" ON public.automation_rules;

CREATE POLICY "Admins manage automation rules"
ON public.automation_rules FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- 4. Ensure public read access for published homepage content
-- First, make sure the policy is correctly named and targeted
DROP POLICY IF EXISTS "Public read for published homepage version" ON public.homepage_versions;
CREATE POLICY "Public read for published homepage version"
ON public.homepage_versions FOR SELECT
TO public
USING (status = 'published'::homepage_version_status);

-- 5. Restore Admin Management Policy for homepage_versions (Ensure it exists correctly)
DROP POLICY IF EXISTS "Admins manage homepage versions" ON public.homepage_versions;
CREATE POLICY "Admins manage homepage versions"
ON public.homepage_versions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

