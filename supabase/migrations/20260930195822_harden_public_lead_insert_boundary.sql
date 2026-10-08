drop policy if exists "Public can insert leads" on public.leads;
create policy "Public can insert validated leads"
on public.leads
for insert
to anon
with check (
  length(btrim(email)) between 3 and 254
  and email ~* '^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$'
  and length(btrim(full_name)) between 2 and 100
  and (phone is null or length(phone) <= 20)
  and amount_mur >= 167
  and amount_mur <= 1000000
  and covers_fees is not null
  and status = 'started'
  and lead_stage = 'Visitor'
  and converted_at is null
  and jsonb_typeof(coalesce(utm_parameters, '{}'::jsonb)) = 'object'
);
revoke insert on table public.leads from anon;
grant insert (
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
) on table public.leads to anon;
