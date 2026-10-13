
create or replace function public.activate_membership(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.user_roles (user_id, role)
  values (p_user_id, 'member')
  on conflict (user_id, role) do nothing;
end;
$function$;

-- The earlier RPC returns JSONB; this hardened version returns a TABLE.
-- PostgreSQL cannot change a function's return type with CREATE OR REPLACE.
DROP FUNCTION IF EXISTS public.assign_organization_owner(uuid, uuid);

create or replace function public.assign_organization_owner(target_org_id uuid, target_user_id uuid)
returns table(success boolean, message text, organization_id uuid, owner_user_id uuid)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_current_user_role text;
  v_user_exists boolean;
  v_org_exists boolean;
begin
  v_current_user_role := (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role';

  if v_current_user_role not in ('admin', 'super_admin') then
    return query select false, 'Only administrators can assign organization owners.', null::uuid, null::uuid;
    return;
  end if;

  select exists(select 1 from auth.users where id = target_user_id) into v_user_exists;
  if not v_user_exists then
    return query select false, 'Target user does not exist.', null::uuid, null::uuid;
    return;
  end if;

  select exists(select 1 from public.organizations where id = target_org_id) into v_org_exists;
  if not v_org_exists then
    return query select false, 'Target organization does not exist.', null::uuid, null::uuid;
    return;
  end if;

  update public.organizations
  set owner_user_id = target_user_id
  where id = target_org_id;

  return query select true, 'Organization owner assigned successfully.', target_org_id, target_user_id;
end;
$function$;

REVOKE ALL ON FUNCTION public.assign_organization_owner(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_organization_owner(uuid, uuid) TO authenticated;

create or replace function public.get_auth_org_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $function$
  select organization_id from public.profiles where id = (select auth.uid());
$function$;

create or replace function public.has_role(requested_role public.app_role)
returns boolean
language sql
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and (role = requested_role or (requested_role = 'admin'::public.app_role and role = 'super_admin'::public.app_role))
  );
$function$;
