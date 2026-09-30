-- Harden the public lead intake boundary.
-- The signup server action is the only public application path that should create
-- pre-member leads. Keep anonymous INSERT limited to the fields it actually uses
-- and enforce the expected initial lifecycle state and amount range.

DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;

CREATE POLICY "Public can insert validated leads"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (
  length(btrim(email)) BETWEEN 3 AND 254
  AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  AND length(btrim(full_name)) BETWEEN 2 AND 100
  AND (phone IS NULL OR length(phone) <= 20)
  AND amount_mur >= 167
  AND amount_mur <= 1000000
  AND covers_fees IS NOT NULL
  AND status = 'started'
  AND lead_stage = 'Visitor'
  AND converted_at IS NULL
  AND jsonb_typeof(coalesce(utm_parameters, '{}'::jsonb)) = 'object'
);

REVOKE INSERT ON TABLE public.leads FROM anon;

GRANT INSERT (
  email,
  full_name,
  phone,
  amount_mur,
  covers_fees,
  status,
  source_initiative_id,
  campaign_link_id,
  utm_parameters,
  last_activity_at,
  lead_stage
) ON TABLE public.leads TO anon;
