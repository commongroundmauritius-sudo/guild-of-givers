
create or replace function public.generate_initiative_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  base_slug text;
  final_slug text;
  counter integer := 1;
begin
  if new.slug is null or new.slug = '' then
    base_slug := lower(regexp_replace(new.title, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' then base_slug := 'initiative'; end if;
    final_slug := base_slug;
    while exists (select 1 from public.initiatives where slug = final_slug and id != new.id) loop
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    end loop;
    new.slug := final_slug;
  end if;
  return new;
end;
$function$;
