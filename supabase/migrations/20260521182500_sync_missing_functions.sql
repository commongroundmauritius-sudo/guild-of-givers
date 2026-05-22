-- Sync missing functions that exist in production but were not in migration files
-- These depend on the 'organizations' table being correctly named.

-- 1. check_report_status_permissions
CREATE OR REPLACE FUNCTION public.check_report_status_permissions()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.has_role('admin'::app_role) THEN
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Unauthorized: Only admins can modify report status';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. check_initiative_status_permissions
CREATE OR REPLACE FUNCTION public.check_initiative_status_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- If the user is NOT an admin
    IF NOT public.has_role('admin'::app_role) THEN
        -- Prevent modification of is_approved or is_published
        IF NEW.is_approved IS DISTINCT FROM OLD.is_approved OR
           NEW.is_published IS DISTINCT FROM OLD.is_published THEN
            RAISE EXCEPTION 'Unauthorized: Only admins can modify initiative status or visibility';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. rls_auto_enable
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS EVENT_TRIGGER AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach triggers if they are missing
DROP TRIGGER IF EXISTS tr_check_report_status ON public.reports;
CREATE TRIGGER tr_check_report_status
    BEFORE UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.check_report_status_permissions();

DROP TRIGGER IF EXISTS tr_check_initiative_status ON public.initiatives;
CREATE TRIGGER tr_check_initiative_status
    BEFORE UPDATE ON public.initiatives
    FOR EACH ROW EXECUTE FUNCTION public.check_initiative_status_permissions();
