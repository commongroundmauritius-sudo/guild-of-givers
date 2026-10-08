create or replace function public.enforce_community_post_moderation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not public.has_role('admin'::public.app_role)
     and not public.has_role('super_admin'::public.app_role) then
    if tg_op = 'INSERT' then
      new.status := 'pending';
      new.is_deleted := false;
      new.deleted_at := null;
    elsif tg_op = 'UPDATE' then
      if new.status is distinct from old.status then
        raise exception 'Unauthorized: only moderators can change post status';
      end if;
      if new.is_deleted is distinct from old.is_deleted then
        raise exception 'Unauthorized: only moderators can change post deletion state';
      end if;
      if new.deleted_at is distinct from old.deleted_at then
        raise exception 'Unauthorized: only moderators can change post deletion timestamp';
      end if;
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_enforce_community_post_moderation on public.community_posts;
create trigger trg_enforce_community_post_moderation
before insert or update on public.community_posts
for each row execute function public.enforce_community_post_moderation();

alter table public.community_posts alter column status set default 'pending';
