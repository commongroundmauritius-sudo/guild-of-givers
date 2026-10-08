create or replace function public.get_homepage_impact_stats()
returns jsonb
language sql
security definer
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'orgs', (select count(*)::integer from public.organizations where is_verified = true and status = 'active'),
    'initiatives', (select count(*)::integer from public.initiatives where is_approved = true and is_published = true and status = 'active'),
    'profiles', (select count(*)::integer from public.profiles where status = 'active'),
    'memberships', (select count(*)::integer from public.subscriptions where status = 'active')
  );
$$;

revoke all on function public.get_homepage_impact_stats() from public, anon, authenticated;
grant execute on function public.get_homepage_impact_stats() to anon, authenticated;
