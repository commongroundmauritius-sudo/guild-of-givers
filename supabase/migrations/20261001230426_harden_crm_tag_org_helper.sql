
create or replace function public.get_crm_tag_org_id(p_tag_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $function$
  select organization_id
  from public.crm_tags
  where id = p_tag_id;
$function$;

revoke execute on function public.get_crm_tag_org_id(uuid) from public, anon;
grant execute on function public.get_crm_tag_org_id(uuid) to authenticated;
