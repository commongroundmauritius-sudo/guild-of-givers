
create or replace function public.validate_public_activity_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.event_type is null then
    raise exception 'Invalid public activity event type';
  end if;
  if new.event_type not in (
    'homepage_view','initiative_view','share_click','lead_captured','campaign_click'
  ) then
    if new.event_type <> 'payment_completed'
       or new.source <> 'backend'
       or coalesce(current_setting('app.internal_activity_write', true), 'false') <> 'true'
    then
      raise exception 'Invalid public activity event type';
    end if;
  end if;
  if new.user_id is not null and new.user_id <> (select auth.uid()) then
    new.user_id := null;
  end if;
  return new;
end;
$function$;

create or replace function public.validate_public_initiative_event_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.event_type is null
     or new.event_type not in ('initiative_view','share_click','member_acquired','member_conversion') then
    raise exception 'Invalid public initiative event type';
  end if;
  if new.user_id is not null and new.user_id <> (select auth.uid()) then
    new.user_id := null;
  end if;
  return new;
end;
$function$;
