-- ================================================================
-- LUMINA v2 UPDATE — Run ໃນ Supabase SQL Editor
-- ================================================================

-- 1. ເພີ່ມ clientToken ໃນ lm_projects (ສຳລັບ link ລູກຄ້າ)
-- (ຂໍ້ມູນຢູ່ໃນ data jsonb ຢູ່ແລ້ວ — ບໍ່ຕ້ອງ alter table)

-- 2. ສ້າງ Storage Bucket ສຳລັບ upload ໄຟລ໌
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lumina-drafts',
  'lumina-drafts', 
  true,
  524288000,  -- 500MB limit
  ARRAY['video/mp4','video/quicktime','video/avi','video/x-matroska','video/webm',
        'image/jpeg','image/png','image/gif','image/webp',
        'application/pdf','application/zip','application/octet-stream']
)
on conflict (id) do nothing;

-- 3. ອະນຸຍາດ anon upload/read/delete
create policy "anon can upload lumina-drafts"
  on storage.objects for insert
  with check (bucket_id = 'lumina-drafts');

create policy "anon can read lumina-drafts"
  on storage.objects for select
  using (bucket_id = 'lumina-drafts');

create policy "anon can update lumina-drafts"
  on storage.objects for update
  using (bucket_id = 'lumina-drafts');

create policy "anon can delete lumina-drafts"
  on storage.objects for delete
  using (bucket_id = 'lumina-drafts');

-- ================================================================
-- DONE ✓
-- ================================================================
