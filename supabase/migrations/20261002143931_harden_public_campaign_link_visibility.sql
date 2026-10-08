drop policy if exists "Anyone can view active campaign links" on public.campaign_links;
create policy "Anyone can view active campaign links"
on public.campaign_links
for select
to anon, authenticated
using (
  is_active = true
  and (expires_at is null or expires_at > now())
);
