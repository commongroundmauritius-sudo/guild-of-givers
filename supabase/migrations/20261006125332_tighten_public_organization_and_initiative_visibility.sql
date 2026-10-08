drop policy if exists "Optimized public view NGOs" on public.organizations;
drop policy if exists "Anyone can view verified organizations" on public.organizations;
create policy "Public can view verified active organizations" on public.organizations
for select to anon, authenticated
using (is_verified = true and status = 'active');

drop policy if exists "Public can view published initiatives" on public.initiatives;
create policy "Public can view approved published active initiatives" on public.initiatives
for select to anon, authenticated
using (is_approved = true and is_published = true and status = 'active');

drop policy if exists "Admins manage initiatives" on public.initiatives;
create policy "Admins manage initiatives" on public.initiatives
for all to authenticated
using (has_role('admin'::app_role) or has_role('super_admin'::app_role))
with check (has_role('admin'::app_role) or has_role('super_admin'::app_role));

drop policy if exists "Admins can manage organizations" on public.organizations;
create policy "Admins can manage organizations" on public.organizations
for all to authenticated
using (has_role('admin'::app_role) or has_role('super_admin'::app_role))
with check (has_role('admin'::app_role) or has_role('super_admin'::app_role));
