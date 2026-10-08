
-- Defense-in-depth: prevent authenticated organization users from moving
-- records into another organization's namespace through UPDATE/INSERT.
-- Existing permissive policies remain responsible for who may act.

create policy "Org boundary for CRM tags"
on public.crm_tags
as restrictive
for all
to authenticated
using ((select public.has_role('admin'::public.app_role)) or organization_id = (select public.get_auth_org_id()))
with check ((select public.has_role('admin'::public.app_role)) or organization_id = (select public.get_auth_org_id()));

create policy "Org boundary for CRM tag assignments"
on public.crm_tag_assignments
as restrictive
for all
to authenticated
using ((select public.has_role('admin'::public.app_role)) or (
  public.get_crm_tag_org_id(tag_id) = public.get_auth_org_id()
  and (lead_id is null or exists (select 1 from public.leads l join public.initiatives i on i.id=l.source_initiative_id where l.id=crm_tag_assignments.lead_id and i.organization_id=public.get_auth_org_id()))
  and (profile_id is null or exists (select 1 from public.profiles p where p.id=crm_tag_assignments.profile_id and p.organization_id=public.get_auth_org_id()))
))
with check ((select public.has_role('admin'::public.app_role)) or (
  public.get_crm_tag_org_id(tag_id) = public.get_auth_org_id()
  and (lead_id is null or exists (select 1 from public.leads l join public.initiatives i on i.id=l.source_initiative_id where l.id=crm_tag_assignments.lead_id and i.organization_id=public.get_auth_org_id()))
  and (profile_id is null or exists (select 1 from public.profiles p where p.id=profile_id and p.organization_id=public.get_auth_org_id()))
));

create policy "Organization document boundary"
on public.organization_documents
as restrictive
for all
to authenticated
using ((select public.has_role('admin'::public.app_role)) or organization_id = (select public.get_auth_org_id()))
with check ((select public.has_role('admin'::public.app_role)) or organization_id = (select public.get_auth_org_id()));
