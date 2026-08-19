-- ============================================================================
-- A.W.W. Helpers — 0010 · storage buckets
-- Public buckets: these images are meant to be seen (a rescue photo is useless
-- if a volunteer cannot load it). Uploads are signed by the API, so the write
-- path is still gated even though reads are open.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('rescues',   'rescues',   true, 8388608,  array['image/jpeg','image/png','image/webp','image/avif']),
  ('animals',   'animals',   true, 8388608,  array['image/jpeg','image/png','image/webp','image/avif']),
  ('orgs',      'orgs',      true, 4194304,  array['image/jpeg','image/png','image/webp','image/avif','image/svg+xml']),
  ('avatars',   'avatars',   true, 2097152,  array['image/jpeg','image/png','image/webp','image/avif']),
  ('lostfound', 'lostfound', true, 8388608,  array['image/jpeg','image/png','image/webp','image/avif']),
  ('campaigns', 'campaigns', true, 8388608,  array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects
  for select using (
    bucket_id in ('rescues','animals','orgs','avatars','lostfound','campaigns')
  );
