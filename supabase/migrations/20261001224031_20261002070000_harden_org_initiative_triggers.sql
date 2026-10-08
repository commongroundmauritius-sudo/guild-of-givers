
create or replace function public.check_initiative_status_permissions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not (public.has_role('admin'::public.app_role) or public.has_role('super_admin'::public.app_role)) then
    if new.is_approved is distinct from old.is_approved
       or new.is_published is distinct from old.is_published then
      raise exception 'Unauthorized: Only admins can modify initiative status or visibility';
    end if;
  end if;
  return new;
end;
$function$;

create or replace function public.protect_organization_security_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not (public.has_role('admin'::public.app_role) or public.has_role('super_admin'::public.app_role)) then
    if new.is_verified is distinct from old.is_verified
       or new.status is distinct from old.status
       or new.owner_user_id is distinct from old.owner_user_id
       or new.created_by_admin_id is distinct from old.created_by_admin_id
       or new.current_collected_amount is distinct from old.current_collected_amount
       or new.supporters_count is distinct from old.supporters_count
       or new.monthly_target_amount is distinct from old.monthly_target_amount then
      raise exception 'Unauthorized: protected organization fields cannot be changed by organization staff';
    end if;
  end if;
  return new;
end;
$function$;

create or replace function public.log_organization_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.organization_audit_log (
    organization_id, changed_by, action, old_values, new_values
  )
  values (
    new.id,
    (select auth.uid()),
    case when tg_op = 'INSERT' then 'CREATE'
         when tg_op = 'UPDATE' then 'UPDATE'
         when tg_op = 'DELETE' then 'DELETE' end,
    case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
    to_jsonb(new)
  );
  return new;
end;
$function$;
