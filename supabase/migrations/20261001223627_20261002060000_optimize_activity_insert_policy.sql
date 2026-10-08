
drop policy if exists "Public can insert validated activities" on public.activities;
create policy "Public can insert validated activities" on public.activities for insert to anon, authenticated with check (
  event_type = any (array['homepage_view','initiative_view','share_click','lead_captured','campaign_click','payment_completed']::text[])
  and (event_type <> 'payment_completed' or (source='backend' and coalesce((select current_setting('app.internal_activity_write', true)),'false')='true'))
  and (user_id is null or user_id=(select auth.uid()))
  and (initiative_id is null or exists (select 1 from public.initiatives i where i.id=activities.initiative_id and i.is_approved=true and i.is_published=true))
  and (organization_id is null or exists (select 1 from public.organizations o where o.id=activities.organization_id))
  and jsonb_typeof(coalesce(metadata,'{}'::jsonb))='object'
);
