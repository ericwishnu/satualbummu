-- =====================================================================
-- SatuAlbumMu — setup database Supabase
-- Cara pakai: buka Supabase Dashboard > SQL Editor > New query >
-- tempel semua isi file ini > Run.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---- Tabel album ----
create table if not exists albums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  reveal_at timestamptz,
  film_preset text default 'klasik',
  created_at timestamptz default now()
);

-- Kalau tabel albums sudah pernah dibuat sebelum ada fitur filter,
-- baris ini menambahkan kolomnya. Aman dijalankan ulang.
alter table albums add column if not exists film_preset text default 'klasik';

-- ---- Tabel foto ----
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references albums(id) on delete cascade,
  storage_path text not null,
  uploader_name text,
  created_at timestamptz default now()
);

-- ---- Row Level Security ----
alter table albums enable row level security;
alter table photos enable row level security;

-- MVP untuk dipakai sendiri: izinkan akses publik (anon).
-- Nanti kalau sudah jadi produk & pakai login, kebijakan ini bisa diperketat.
drop policy if exists "albums_read" on albums;
drop policy if exists "albums_insert" on albums;
drop policy if exists "photos_read" on photos;
drop policy if exists "photos_insert" on photos;

create policy "albums_read"   on albums for select using (true);
create policy "albums_insert" on albums for insert with check (true);
create policy "photos_read"   on photos for select using (true);
create policy "photos_insert" on photos for insert with check (true);

-- ---- Kebijakan Storage (bucket "photos") ----
-- CATATAN: buat dulu bucket bernama "photos" (Public) lewat menu Storage,
-- baru jalankan bagian ini.
drop policy if exists "photos_obj_read"   on storage.objects;
drop policy if exists "photos_obj_insert" on storage.objects;

create policy "photos_obj_read"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "photos_obj_insert"
  on storage.objects for insert
  with check (bucket_id = 'photos');
