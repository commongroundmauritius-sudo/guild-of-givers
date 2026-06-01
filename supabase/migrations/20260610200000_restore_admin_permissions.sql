-- Restore and Harden Admin/Service Permissions for CMS and CRM

-- 1. Grant Table Permissions
DO $$
BEGIN
    -- CMS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'homepage_versions') THEN
        GRANT ALL ON public.homepage_versions TO authenticated, service_role;
        GRANT SELECT ON public.homepage_versions TO anon;
    END IF;

    -- CRM & Automation
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automation_rules') THEN
        GRANT ALL ON public.automation_rules TO authenticated, service_role;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_tags') THEN
        GRANT ALL ON public.crm_tags TO authenticated, service_role;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_tag_assignments') THEN
        GRANT ALL ON public.crm_tag_assignments TO authenticated, service_role;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_notes') THEN
        GRANT ALL ON public.crm_notes TO authenticated, service_role;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_tasks') THEN
        GRANT ALL ON public.crm_tasks TO authenticated, service_role;
    END IF;

    -- Financials
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_events') THEN
        GRANT ALL ON public.financial_events TO authenticated, service_role;
    END IF;

    -- Audit Logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        GRANT ALL ON public.audit_logs TO authenticated, service_role;
    END IF;
END $$;

-- 2. Grant Sequence Permissions (Crucial for INSERTs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- 3. Harden Automation Rules Policy (Admin Only)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automation_rules') THEN
        DROP POLICY IF EXISTS "Orgs can manage their own automation rules" ON public.automation_rules;
        DROP POLICY IF EXISTS "Admins manage automation rules" ON public.automation_rules;

        CREATE POLICY "Admins manage automation rules"
        ON public.automation_rules FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
          )
        );
    END IF;
END $$;

-- 4. Update existing homepage configurations to include FAQ section if missing
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'homepage_versions') THEN
        UPDATE public.homepage_versions
        SET configuration_json = jsonb_set(
            configuration_json,
            '{sections}',
            (configuration_json->'sections') || '[{"id": "faq", "visible": true, "settings": {}}]'::jsonb
        )
        WHERE status = 'published' AND NOT (configuration_json->'sections' @> '[{"id": "faq"}]'::jsonb);
    END IF;
END $$;
