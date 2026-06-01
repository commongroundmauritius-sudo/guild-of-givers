-- Restore and Harden Admin/Service Permissions for CRM and Automation

-- 1. Grant Table Permissions
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

-- 4. Update existing homepage configurations to include FAQ section if missing
UPDATE public.homepage_versions
SET configuration_json = jsonb_set(
    configuration_json,
    '{sections}',
    (configuration_json->'sections') || '[{"id": "faq", "visible": true, "settings": {}}]'::jsonb
)
WHERE NOT (configuration_json->'sections' @> '[{"id": "faq"}]'::jsonb);
