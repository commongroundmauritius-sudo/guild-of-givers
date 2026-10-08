
drop policy if exists "Org staff can manage notes" on public.crm_notes;
create policy "Org staff can manage notes"
on public.crm_notes
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.organization_id = crm_notes.organization_id
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.organization_id = crm_notes.organization_id
  )
);

drop policy if exists "Orgs can manage their own crm tasks" on public.crm_tasks;
create policy "Orgs can manage their own crm tasks"
on public.crm_tasks
for all
to authenticated
using (
  (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid())
    )
  )
  or has_role('admin'::public.app_role)
  or has_role('super_admin'::public.app_role)
)
with check (
  (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid())
    )
  )
  or has_role('admin'::public.app_role)
  or has_role('super_admin'::public.app_role)
);
