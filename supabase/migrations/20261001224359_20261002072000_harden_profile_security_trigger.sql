
create or replace function public.protect_profile_security_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not public.has_role('admin'::public.app_role)
     and not public.has_role('super_admin'::public.app_role) then
    if new.organization_id is distinct from old.organization_id
       or new.status is distinct from old.status
       or new.source_initiative_id is distinct from old.source_initiative_id
       or new.primary_initiative_id is distinct from old.primary_initiative_id
       or new.lifecycle_stage is distinct from old.lifecycle_stage then
      raise exception 'Unauthorized: protected profile fields cannot be changed by the profile owner';
    end if;
  end if;
  return new;
end;
$function$;
