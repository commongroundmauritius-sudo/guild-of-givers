create or replace function public.get_my_role()
returns public.app_role
language sql
security definer
stable
set search_path = ''
as $function$
  select ur.role
  from public.user_roles ur
  where ur.user_id = auth.uid()
  order by case ur.role
    when 'super_admin' then 1
    when 'admin' then 2
    when 'organization' then 3
    when 'ngo' then 4
    when 'member' then 5
    else 99
  end
  limit 1;
$function$;

revoke all on function public.get_my_role() from public;
revoke all on function public.get_my_role() from anon;
revoke all on function public.get_my_role() from service_role;
grant execute on function public.get_my_role() to authenticated;
