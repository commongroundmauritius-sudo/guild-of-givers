-- Remove self-service role creation. Signup trigger/server workflow is the authority for roles.
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

-- Leads contain personal/contact and CRM information. Public onboarding creates leads through the server action;
-- anonymous clients must not be able to update arbitrary existing leads by guessing an ID.
DROP POLICY IF EXISTS "Public can update lead during onboarding" ON public.leads;

-- Initiative updates are member/organization/admin content, not public content.
DROP POLICY IF EXISTS "Anyone can view initiative updates" ON public.initiative_updates;
CREATE POLICY "Authenticated users can view approved initiative updates"
ON public.initiative_updates FOR SELECT TO authenticated
USING (
  public.has_role('admin'::public.app_role)
  OR public.has_role('super_admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = (SELECT auth.uid()) AND s.status = 'active'::public.subscription_status
  )
  OR EXISTS (
    SELECT 1
    FROM public.initiatives i
    JOIN public.profiles p ON p.organization_id = i.organization_id
    WHERE i.id = initiative_updates.initiative_id AND p.id = (SELECT auth.uid())
  )
);

-- Organization owners/staff must not be able to modify verification, ownership, financial counters,
-- or other platform-controlled fields through the broad organization update policy.
CREATE OR REPLACE FUNCTION public.protect_organization_security_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT (public.has_role('admin'::public.app_role) OR public.has_role('super_admin'::public.app_role)) THEN
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id
       OR NEW.created_by_admin_id IS DISTINCT FROM OLD.created_by_admin_id
       OR NEW.current_collected_amount IS DISTINCT FROM OLD.current_collected_amount
       OR NEW.supporters_count IS DISTINCT FROM OLD.supporters_count
       OR NEW.monthly_target_amount IS DISTINCT FROM OLD.monthly_target_amount THEN
      RAISE EXCEPTION 'Unauthorized: protected organization fields cannot be changed by organization staff';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS trg_protect_organization_security_fields ON public.organizations;
CREATE TRIGGER trg_protect_organization_security_fields
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.protect_organization_security_fields();

-- Remove duplicate public organization update policy; the authenticated policy is the authoritative boundary.
DROP POLICY IF EXISTS "Org owners, admins, and staff can update organizations" ON public.organizations;

-- Public-facing team listing should only expose rows explicitly marked for public display when such a field exists.
-- No schema change is made here; access remains public because this is intended public organization profile content.

-- Tighten admin-only financial configuration/payout/account policies to authenticated users.
DROP POLICY IF EXISTS "Admins can manage fee configurations" ON public.fee_configurations;
CREATE POLICY "Admins can manage fee configurations"
ON public.fee_configurations FOR ALL TO authenticated
USING (public.has_role('admin'::public.app_role) OR public.has_role('super_admin'::public.app_role))
WITH CHECK (public.has_role('admin'::public.app_role) OR public.has_role('super_admin'::public.app_role));
DROP POLICY IF EXISTS "Admins can manage financial accounts" ON public.financial_accounts;
CREATE POLICY "Admins can manage financial accounts"
ON public.financial_accounts FOR ALL TO authenticated
USING (public.has_role('admin'::public.app_role) OR public.has_role('super_admin'::public.app_role))
WITH CHECK (public.has_role('admin'::public.app_role) OR public.has_role('super_admin'::public.app_role));
DROP POLICY IF EXISTS "Admins can manage payouts" ON public.payouts;
CREATE POLICY "Admins can manage payouts"
ON public.payouts FOR ALL TO authenticated
USING (public.has_role('admin'::public.app_role) OR public.has_role('super_admin'::public.app_role))
WITH CHECK (public.has_role('admin'::public.app_role) OR public.has_role('super_admin'::public.app_role));

-- Financial event visibility is authenticated-only; row-level conditions still control which rows are visible.
DROP POLICY IF EXISTS "Members can view own payment events" ON public.financial_events;
CREATE POLICY "Members can view own payment events"
ON public.financial_events FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Organizations can view allocations to their initiatives" ON public.financial_events;
CREATE POLICY "Organizations can view allocations to their initiatives"
ON public.financial_events FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives i
    JOIN public.profiles p ON p.organization_id = i.organization_id
    WHERE i.id = financial_events.initiative_id AND p.id = (SELECT auth.uid())
  )
);

-- Harden public analytics/activity ingestion against arbitrary event types and forged ownership metadata.
CREATE OR REPLACE FUNCTION public.validate_public_activity_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.event_type IS NULL OR NEW.event_type NOT IN (
    'homepage_view','initiative_view','share_click','lead_captured','campaign_click'
  ) THEN
    RAISE EXCEPTION 'Invalid public activity event type';
  END IF;
  IF NEW.user_id IS NOT NULL AND NEW.user_id <> (SELECT auth.uid()) THEN
    NEW.user_id := NULL;
  END IF;
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS trg_validate_public_activity_insert ON public.activities;
CREATE TRIGGER trg_validate_public_activity_insert
BEFORE INSERT ON public.activities
FOR EACH ROW EXECUTE FUNCTION public.validate_public_activity_insert();

-- Public initiative event ingestion is limited to attribution/analytics event types.
CREATE OR REPLACE FUNCTION public.validate_public_initiative_event_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.event_type IS NULL OR NEW.event_type NOT IN ('initiative_view','share_click','member_acquired','member_conversion') THEN
    RAISE EXCEPTION 'Invalid public initiative event type';
  END IF;
  IF NEW.user_id IS NOT NULL AND NEW.user_id <> (SELECT auth.uid()) THEN
    NEW.user_id := NULL;
  END IF;
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS trg_validate_public_initiative_event_insert ON public.initiative_events;
CREATE TRIGGER trg_validate_public_initiative_event_insert
BEFORE INSERT ON public.initiative_events
FOR EACH ROW EXECUTE FUNCTION public.validate_public_initiative_event_insert();

