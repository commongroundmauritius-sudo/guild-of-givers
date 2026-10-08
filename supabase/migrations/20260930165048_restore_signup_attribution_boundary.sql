CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  sub_amount DECIMAL; fee_cover BOOLEAN; requested_role TEXT;
  v_role public.app_role := 'member'; v_org_id UUID; v_partner_valid BOOLEAN := false; source_init_id UUID;
BEGIN
  requested_role := COALESCE(new.raw_user_meta_data->>'role', 'member');
  v_org_id := (new.raw_user_meta_data->>'organization_id')::UUID;
  source_init_id := (new.raw_user_meta_data->>'source_initiative_id')::UUID;
  IF requested_role = 'organization' THEN
    IF v_org_id IS NULL THEN RAISE EXCEPTION 'Organization signup requires a verified organization assignment.'; END IF;
    SELECT EXISTS (SELECT 1 FROM public.partner_applications pa WHERE pa.converted_organization_id = v_org_id AND pa.status = 'converted' AND lower(pa.email) = lower(new.email)) INTO v_partner_valid;
    IF NOT v_partner_valid THEN RAISE EXCEPTION 'Organization signup is only available through a verified partner invitation.'; END IF;
    v_role := 'organization';
  ELSIF requested_role <> 'member' THEN RAISE EXCEPTION 'Invalid signup role.'; END IF;
  INSERT INTO public.profiles (id, full_name, email, organization_id, source_initiative_id, primary_initiative_id)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', ''), new.email,
    CASE WHEN v_role = 'organization' THEN v_org_id ELSE NULL END,
    CASE WHEN v_role = 'member' THEN source_init_id ELSE NULL END,
    CASE WHEN v_role = 'member' THEN source_init_id ELSE NULL END)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email,
    organization_id = EXCLUDED.organization_id,
    source_initiative_id = COALESCE(profiles.source_initiative_id, EXCLUDED.source_initiative_id),
    primary_initiative_id = COALESCE(profiles.primary_initiative_id, EXCLUDED.primary_initiative_id);
  INSERT INTO public.user_roles (user_id, role) VALUES (new.id, v_role) ON CONFLICT (user_id, role) DO NOTHING;
  IF v_role = 'member' THEN
    sub_amount := (new.raw_user_meta_data->>'subscription_amount')::NUMERIC;
    fee_cover := COALESCE((new.raw_user_meta_data->>'covers_fees')::BOOLEAN, false);
    IF sub_amount IS NOT NULL AND sub_amount > 0 THEN
      INSERT INTO public.subscriptions (user_id, amount_mur, status, covers_fees) VALUES (new.id, sub_amount, 'pending', fee_cover);
    END IF;
    IF source_init_id IS NOT NULL THEN
      INSERT INTO public.member_preferences (user_id, initiative_id, priority_level)
      VALUES (new.id, source_init_id, 1) ON CONFLICT (user_id, initiative_id) DO NOTHING;
    END IF;
  END IF;
  RETURN new;
END;
$function$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.handle_lead_conversion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.leads SET status='converted', converted_at=COALESCE(converted_at, now()), last_activity_at=now(), lead_stage='Subscriber'
  WHERE lower(email)=lower(NEW.email) AND status IN ('started','converted')
    AND source_initiative_id IS NOT DISTINCT FROM NEW.source_initiative_id;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_lead_conversion() FROM PUBLIC;