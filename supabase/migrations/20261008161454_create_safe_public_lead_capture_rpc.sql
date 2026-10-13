-- Capture public signup leads through a narrowly validated RPC instead of direct table writes.
CREATE OR REPLACE FUNCTION public.create_lead_safe(
  p_email text,
  p_full_name text,
  p_phone text,
  p_amount_mur numeric,
  p_covers_fees boolean,
  p_source_initiative_id uuid,
  p_campaign_link_id uuid,
  p_utm_parameters jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_email text := lower(btrim(p_email));
  v_lead public.leads;
BEGIN
  IF v_email IS NULL OR length(v_email) NOT BETWEEN 3 AND 254
     OR v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  THEN
    RAISE EXCEPTION 'Invalid email address';
  END IF;

  IF p_full_name IS NULL OR length(btrim(p_full_name)) NOT BETWEEN 2 AND 100
  THEN
    RAISE EXCEPTION 'Invalid full name';
  END IF;

  IF p_phone IS NOT NULL AND length(p_phone) > 20
  THEN
    RAISE EXCEPTION 'Invalid phone number';
  END IF;

  IF p_amount_mur IS NULL OR p_amount_mur < 167 OR p_amount_mur > 1000000
  THEN
    RAISE EXCEPTION 'Invalid membership amount';
  END IF;

  IF p_source_initiative_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.initiatives i
    WHERE i.id = p_source_initiative_id
      AND i.is_approved = true
      AND i.is_published = true
      AND coalesce(i.is_impact_pool, false) = false
  ) THEN
    RAISE EXCEPTION 'Invalid source initiative';
  END IF;

  IF p_campaign_link_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.campaign_links cl
    JOIN public.initiatives i ON i.id = cl.initiative_id
    WHERE cl.id = p_campaign_link_id
      AND cl.is_active = true
      AND (cl.expires_at IS NULL OR cl.expires_at > now())
      AND i.is_approved = true
      AND i.is_published = true
      AND coalesce(i.is_impact_pool, false) = false
      AND (p_source_initiative_id IS NULL OR cl.initiative_id = p_source_initiative_id)
  ) THEN
    RAISE EXCEPTION 'Invalid campaign link';
  END IF;

  INSERT INTO public.leads
    (email, full_name, phone, amount_mur, covers_fees, status, lead_stage,
     source_initiative_id, campaign_link_id, utm_parameters, last_activity_at)
  VALUES
    (v_email, btrim(p_full_name), nullif(btrim(p_phone), ''), p_amount_mur,
     coalesce(p_covers_fees, false), 'started', 'Visitor',
     p_source_initiative_id, p_campaign_link_id,
     coalesce(p_utm_parameters, '{}'::jsonb), now())
  ON CONFLICT (email) DO UPDATE
    SET last_activity_at = now(), lead_stage = 'Visitor'
  RETURNING * INTO v_lead;

  RETURN jsonb_build_object('success', true, 'id', v_lead.id);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_lead_safe(text,text,text,numeric,boolean,uuid,uuid,jsonb) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.create_lead_safe(text,text,text,numeric,boolean,uuid,uuid,jsonb) TO anon;
