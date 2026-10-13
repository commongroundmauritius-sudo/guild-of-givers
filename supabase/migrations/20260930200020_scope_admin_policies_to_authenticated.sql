DO $scope_policies$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('Admins can insert actions', 'admin_actions'),
      ('Admins can view all actions', 'admin_actions'),
      ('Admins can view all allocations', 'allocations'),
      ('Users can view own allocations', 'allocations'),
      ('Admins can manage billing cycles', 'billing_cycles'),
      ('Admins can view billing runs', 'billing_runs'),
      ('Authors and admins can delete posts', 'community_posts'),
      ('Authors can edit own posts within one hour', 'community_posts'),
      ('Authors can view own posts', 'community_posts'),
      ('Admins can manage funding cycles', 'initiative_funding_cycles'),
      ('Admins can manage all initiative versions', 'initiative_versions'),
      ('Admins can manage leads', 'leads'),
      ('Users and admins can view member preferences', 'member_preferences'),
      ('Admins and org staff can view audit logs', 'organization_audit_log'),
      ('Owners can manage organization documents', 'organization_documents'),
      ('Admins can manage organizations', 'organizations'),
      ('Admins can view all payments', 'payments'),
      ('Authors can edit own comments within one hour', 'post_comments'),
      ('Admins can view all profiles', 'profiles'),
      ('Admins can view all receipts', 'receipts'),
      ('Admins can view all subscriptions', 'subscriptions'),
      ('Admins can view all roles', 'user_roles')
    ) AS policy_targets(policy_name, table_name)
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = item.table_name
        AND policyname = item.policy_name
    ) THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.%I TO authenticated',
        item.policy_name,
        item.table_name
      );
    END IF;
  END LOOP;
END
$scope_policies$;
