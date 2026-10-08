
create policy "Community image paths are user scoped"
on storage.objects
as restrictive
for insert
to authenticated
with check (
  bucket_id = 'community-posts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
