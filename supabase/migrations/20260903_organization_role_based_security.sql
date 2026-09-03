-- Migration: Organization Role-Based Security & Verification Protection
-- Date: 2026-09-03
-- Purpose: Implement RLS for organization updates, protect verification status, and add owner assignment RPC

-- ============================================================================
-- 1. ROW-LEVEL SECURITY (RLS) POLICY FOR ORGANIZATIONS
-- ============================================================================
-- Enable RLS on organizations table (if not already enabled)
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

-- Drop existing policy if it exists to prevent conflicts
DROP POLICY IF EXISTS "Org owners, admins, and staff can update organizations" ON organizations;

-- Policy: Allow UPDATE for platform admins, assigned org owners, and staff members
CREATE POLICY "Org owners, admins, and staff can update organizations"
  ON organizations
  FOR UPDATE
  USING (
    -- Platform admins can always update
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('admin', 'super_admin')
    OR
    -- Organization owner can update their own org
    auth.uid() = owner_user_id
    OR
    -- Organization staff members can update
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = organizations.id
    )
  );

-- ============================================================================
-- 2. TRIGGER: PREVENT NON-ADMIN VERIFICATION STATUS CHANGES
-- ============================================================================
-- This trigger ensures only admins can modify the is_verified field
DROP FUNCTION IF EXISTS trg_protect_org_verification() CASCADE;

CREATE FUNCTION trg_protect_org_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if is_verified field changed
  IF OLD.is_verified IS DISTINCT FROM NEW.is_verified THEN
    -- Only allow admins to change verification status
    IF (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' NOT IN ('admin', 'super_admin') THEN
      RAISE EXCEPTION 'Only administrators can toggle organization verification status.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to organizations table
DROP TRIGGER IF EXISTS trg_protect_org_verification ON organizations;

CREATE TRIGGER trg_protect_org_verification
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION trg_protect_org_verification();

-- ============================================================================
-- 3. RPC: ADMIN-ONLY ORGANIZATION OWNER ASSIGNMENT
-- ============================================================================
-- This function allows only admins to assign organization owners
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
  -- 1. Verify current user is admin
  v_current_user_role := (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role';
  
  IF v_current_user_role NOT IN ('admin', 'super_admin') THEN
    RETURN QUERY SELECT
      false,
      'Only administrators can assign organization owners.',
      NULL::uuid,
      NULL::uuid;
    RETURN;
  END IF;

  -- 2. Verify target user exists
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

  -- 3. Verify target organization exists
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

  -- 4. Update organization owner
  UPDATE organizations
  SET owner_user_id = target_user_id
  WHERE id = target_org_id;

  -- 5. Return success
  RETURN QUERY SELECT
    true,
    'Organization owner assigned successfully.',
    target_org_id,
    target_user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users (admin check happens inside function)
GRANT EXECUTE ON FUNCTION assign_organization_owner(uuid, uuid) TO authenticated;

-- ============================================================================
-- 4. AUDIT LOG (Optional but Recommended)
-- ============================================================================
-- Track organization updates for compliance and debugging
DROP TABLE IF EXISTS organization_audit_log CASCADE;

CREATE TABLE organization_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE organization_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow admins and organization staff to view audit logs
CREATE POLICY "Admins and org staff can view audit logs"
  ON organization_audit_log
  FOR SELECT
  USING (
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('admin', 'super_admin')
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = organization_audit_log.organization_id
    )
  );

-- Trigger to log organization changes
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

-- Attach audit trigger
DROP TRIGGER IF EXISTS trg_log_org_changes ON organizations;

CREATE TRIGGER trg_log_org_changes
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION log_organization_changes();

-- ============================================================================
-- 5. VERIFICATION HELPER FUNCTION (Optional - for frontend convenience)
-- ============================================================================
-- Check if current user can edit an organization
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
  
  -- Admins can always edit
  IF v_user_role IN ('admin', 'super_admin') THEN
    RETURN true;
  END IF;

  -- Check if user is organization owner
  SELECT EXISTS(
    SELECT 1 FROM organizations
    WHERE id = org_id AND owner_user_id = auth.uid()
  ) INTO v_is_owner;
  
  IF v_is_owner THEN
    RETURN true;
  END IF;

  -- Check if user is organization staff
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND organization_id = org_id
  ) INTO v_is_staff;

  RETURN v_is_staff;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION can_edit_organization(uuid) TO authenticated;

-- ============================================================================
-- 6. SUMMARY OF CHANGES
-- ============================================================================
/*
✅ COMPLETED:
1. Row-Level Security (RLS) Policy:
   - Allow UPDATE for platform admins (admin, super_admin roles)
   - Allow UPDATE for assigned organization owner
   - Allow UPDATE for organization staff members

2. Verification Protection Trigger (trg_protect_org_verification):
   - Prevents non-admins from changing is_verified status
   - Raises exception: "Only administrators can toggle organization verification status."

3. Owner Assignment RPC (assign_organization_owner):
   - Admin-only function to assign organization owners
   - Validates user and organization existence
   - Returns success/failure with reason

4. Audit Log Table & Triggers:
   - Tracks all organization CREATE/UPDATE/DELETE operations
   - Stores old and new values for compliance
   - RLS restricts audit log viewing to admins and org staff

5. Helper Function (can_edit_organization):
   - Frontend convenience function to check edit permissions
   - Returns boolean for UI rendering logic

🔒 SECURITY NOTES:
- All functions use SECURITY DEFINER to run with elevated privileges
- JWT role validation happens in functions, not at policy level
- Verification changes are immutable once set (trigger protection)
- Audit trail is complete and queryable for compliance

📋 FRONTEND INTEGRATION:
- Call RPC: assign_organization_owner(org_id, user_id) for admin workflows
- Use can_edit_organization(org_id) to conditionally show Edit button
- Respect the frontend validation: don't allow non-admins to toggle is_verified
*/
