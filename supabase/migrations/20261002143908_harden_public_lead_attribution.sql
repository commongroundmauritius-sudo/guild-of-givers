DROP POLICY IF EXISTS "Public can insert validated leads" ON public.leads;
CREATE POLICY "Public can insert validated leads"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (
  length(btrim(email)) >= 3
  AND length(btrim(email)) <= 254
  AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$'
  AND length(btrim(full_name)) >= 2
  AND length(btrim(full_name)) <= 100
  AND (phone IS NULL OR length(phone) <= 20)
  AND amount_mur >= 167
  AND amount_mur <= 1000000
  AND covers_fees IS NOT NULL
  AND status = 'started'
  AND lead_stage = 'Visitor'
  AND converted_at IS NULL
  AND jsonb_typeof(COALESCE(utm_parameters, '{}'::jsonb)) = 'object'
  AND campaign_id IS NULL
  AND (
    source_initiative_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.initiatives i
      WHERE i.id = source_initiative_id
        AND i.is_approved = true
        AND i.is_published = true
        AND COALESCE(i.is_impact_pool, false) = false
    )
  )
  AND (
    campaign_link_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.campaign_links cl
      JOIN public.initiatives i ON i.id = cl.initiative_id
      WHERE cl.id = campaign_link_id
        AND cl.is_active = true
        AND (cl.expires_at IS NULL OR cl.expires_at > now())
        AND i.is_approved = true
        AND i.is_published = true
        AND COALESCE(i.is_impact_pool, false) = false
        AND (source_initiative_id IS NULL OR cl.initiative_id = source_initiative_id)
    )
  )
);
