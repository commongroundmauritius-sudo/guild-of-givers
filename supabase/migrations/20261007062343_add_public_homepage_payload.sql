create or replace function public.get_public_homepage_payload()
returns jsonb language sql stable security definer set search_path=''
as $$
with published as (
 select id,configuration_json,published_at from public.homepage_versions where status='published' order by published_at desc nulls last limit 1
), featured_ids as (
 select value::uuid id, ord from published, jsonb_array_elements(coalesce(published.configuration_json->'sections','[]'::jsonb)) sec(section), jsonb_array_elements_text(coalesce(sec.section->'settings'->'manual_ids','[]'::jsonb)) with ordinality ids(value,ord)
 where sec.section->>'id'='featured' and coalesce((sec.section->>'visible')::boolean,false)
), featured as (
 select jsonb_agg(jsonb_build_object('id',i.id,'slug',i.slug,'title',i.title,'caption',i.caption,'summary',i.summary,'description',i.description,'goal_amount_mur',i.goal_amount_mur,'current_amount_mur',i.current_amount_mur,'image_url',i.image_url,'organizations',case when o.id is null then null else jsonb_build_object('organization_name',o.organization_name) end) order by fi.ord) items
 from featured_ids fi join public.initiatives i on i.id=fi.id left join public.organizations o on o.id=i.organization_id
 where i.is_approved and i.is_published and i.status='active' and (o.id is null or (o.is_verified and o.status='active'))
)
select jsonb_build_object('publishedVersion',case when p.id is null then null else jsonb_build_object('id',p.id,'configuration_json',p.configuration_json,'published_at',p.published_at) end,'featuredInitiatives',coalesce((select items from featured),'[]'::jsonb)) from published p right join (select 1) one on true;
$$;
revoke all on function public.get_public_homepage_payload() from public,anon,authenticated;
grant execute on function public.get_public_homepage_payload() to anon,authenticated;
