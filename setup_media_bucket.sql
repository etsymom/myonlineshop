-- setup_media_bucket.sql

-- 1. Create the bucket
insert into storage.buckets (id, name, public) 
values ('inkwell_media', 'inkwell_media', true) 
on conflict (id) do nothing;

-- 2. Setup Storage Policies
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access" on storage.objects for select using (bucket_id = 'inkwell_media');

drop policy if exists "Auth Upload" on storage.objects;
create policy "Auth Upload" on storage.objects for insert with check (bucket_id = 'inkwell_media' and auth.role() = 'authenticated');

drop policy if exists "Auth Update" on storage.objects;
create policy "Auth Update" on storage.objects for update using (bucket_id = 'inkwell_media' and auth.uid() = owner);

drop policy if exists "Auth Delete" on storage.objects;
create policy "Auth Delete" on storage.objects for delete using (bucket_id = 'inkwell_media' and auth.uid() = owner);

-- 3. Add new columns to profiles
alter table profiles add column if not exists avatar_url text;

-- 4. Add new columns to albums
alter table albums add column if not exists media_url text;
alter table albums add column if not exists media_type text;

-- 5. Fix Profiles RLS for public read
drop policy if exists "Allow public read access to profiles" on profiles;
create policy "Allow public read access to profiles" on profiles for select using (true);
