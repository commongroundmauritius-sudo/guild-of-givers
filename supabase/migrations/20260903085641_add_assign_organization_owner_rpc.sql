-- An earlier organization-security migration defines this signature with a TABLE return type.
-- Drop it explicitly before this legacy JSONB definition; a later hardening migration
-- installs the final TABLE-returning version again.
DROP FUNCTION IF EXISTS public.assign_organization_owner(UUID, UUID);

CREATE OR REPLACE FUNCTION public.assign_organization_owner(
  target_org_id UUID,
  target_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_org_name TEXT;
  v_user_email TEXT;
BEGIN
  -- Authoritative admin check
  IF NOT (has_role('admin'::app_role) OR has_role('super_admin'::app_role)) THEN
    RAISE EXCEPTION 'Unauthorized: Only platform administrators can assign organization owners.';
  END IF;

  -- Verify organization exists
  SELECT organization_name INTO v_org_name
  FROM public.organizations
  WHERE id = target_org_id;

  IF v_org_name IS NULL THEN
    RAISE EXCEPTION 'Organization with ID % not found.', target_org_id;
  END IF;

  -- Update owner_user_id on organization
  UPDATE public.organizations
  SET owner_user_id = target_user_id
  WHERE id = target_org_id;

  -- Also link organization_id on the user profile for full consistency
  IF target_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET organization_id = target_org_id
    WHERE id = target_user_id;

    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = target_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'org_id', target_org_id,
    'org_name', v_org_name,
    'owner_user_id', target_user_id,
    'owner_email', v_user_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke public access, grant strictly to authenticated
REVOKE ALL ON FUNCTION public.assign_organization_owner(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_organization_owner(UUID, UUID) TO authenticated;
