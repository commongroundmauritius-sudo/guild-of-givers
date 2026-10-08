DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'organizations' AND n.nspname = 'public'
      AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DROP POLICY IF EXISTS "Org owners, admins, and staff can update organizations" ON organizations;

CREATE POLICY "Org owners, admins, and staff can update organizations"
  ON organizations
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('admin', 'super_admin')
    OR
    auth.uid() = owner_user_id
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = organizations.id
    )
  );

DROP FUNCTION IF EXISTS trg_protect_org_verification() CASCADE;

CREATE FUNCTION trg_protect_org_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_verified IS DISTINCT FROM NEW.is_verified THEN
    IF (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' NOT IN ('admin', 'super_admin') THEN
      RAISE EXCEPTION 'Only administrators can toggle organization verification status.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_org_verification ON organizations;

CREATE TRIGGER trg_protect_org_verification
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION trg_protect_org_verification();

DROP FUNCTION IF EXISTS assign_organization_owner(uuid, uuid);

CREATE FUNCTION assign_organization_owner(
  target_org_id uuid,
  target_user_id uuid
)
RETURNS TABLE(
  success boolean,
  message text,
  organization_id uuid,
  owner_user_id uuid
)
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_current_user_role text;
  v_user_exists boolean;
  v_org_exists boolean;
BEGIN
  v_current_user_role := (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role';
  
  IF v_current_user_role NOT IN ('admin', 'super_admin') THEN
    RETURN QUERY SELECT
      false,
      'Only administrators can assign organization owners.',
      NULL::uuid,
      NULL::uuid;
    RETURN;
  END IF;

  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = target_user_id)
  INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RETURN QUERY SELECT
      false,
      'Target user does not exist.',
      NULL::uuid,
      NULL::uuid;
    RETURN;
  END IF;

  SELECT EXISTS(SELECT 1 FROM organizations WHERE id = target_org_id)
  INTO v_org_exists;
  
  IF NOT v_org_exists THEN
    RETURN QUERY SELECT
      false,
      'Target organization does not exist.',
      NULL::uuid,
      NULL::uuid;
    RETURN;
  END IF;

  UPDATE organizations
  SET owner_user_id = target_user_id
  WHERE id = target_org_id;

  RETURN QUERY SELECT
    true,
    'Organization owner assigned successfully.',
    target_org_id,
    target_user_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION assign_organization_owner(uuid, uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS organization_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE organization_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and org staff can view audit logs" ON organization_audit_log;

CREATE POLICY "Admins and org staff can view audit logs"
  ON organization_audit_log
  FOR SELECT
  USING (
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('admin', 'super_admin')
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = organization_audit_log.organization_id
    )
  );

DROP FUNCTION IF EXISTS log_organization_changes() CASCADE;

CREATE FUNCTION log_organization_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_audit_log (
    organization_id,
    changed_by,
    action,
    old_values,
    new_values
  )
  VALUES (
    NEW.id,
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN 'CREATE'
         WHEN TG_OP = 'UPDATE' THEN 'UPDATE'
         WHEN TG_OP = 'DELETE' THEN 'DELETE'
    END,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_org_changes ON organizations;

CREATE TRIGGER trg_log_org_changes
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION log_organization_changes();

DROP FUNCTION IF EXISTS can_edit_organization(uuid);

CREATE FUNCTION can_edit_organization(org_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_role text;
  v_is_owner boolean;
  v_is_staff boolean;
BEGIN
  v_user_role := (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role';
  
  IF v_user_role IN ('admin', 'super_admin') THEN
    RETURN true;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM organizations
    WHERE id = org_id AND owner_user_id = auth.uid()
  ) INTO v_is_owner;
  
  IF v_is_owner THEN
    RETURN true;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND organization_id = org_id
  ) INTO v_is_staff;

  RETURN v_is_staff;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION can_edit_organization(uuid) TO authenticated;
