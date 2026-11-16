-- ============================================================
-- EvntCult AI Face Search (Supabase free tier + pgvector)
-- Run once in Supabase → SQL Editor. Safe to re-run.
--
-- Embeddings come from @vladmandic/face-api (FaceRecognitionNet, 128-d), made by
-- scripts/index-drive-album.ts for event photos and in the attendee's browser for
-- the selfie. Both sides L2-normalise the vector before it gets here, so cosine
-- similarity = dot product. Measured on test photos: same person ≈ 0.97–1.00,
-- different people ≈ 0.83–0.91. EvntCult queries with 0.93 (FACE_MATCH_THRESHOLD).
-- ============================================================

create extension if not exists vector with schema extensions;

-- One row per photo in a photographer's Google Drive folder
create table if not exists public.event_photos (
  id             uuid primary key default gen_random_uuid(),
  event_id       text not null,          -- EvntCult event id (Cloudflare D1, so no foreign key)
  drive_file_id  text not null unique,   -- re-running the import never duplicates a photo
  thumbnail_url  text not null,
  created_at     timestamptz not null default now(),
  constraint drive_file_id_format check (drive_file_id ~ '^[A-Za-z0-9_-]{20,}$')
);
create index if not exists event_photos_event_idx on public.event_photos (event_id);

-- One row per face found in a photo
create table if not exists public.photo_faces (
  id          bigint generated always as identity primary key,
  photo_id    uuid not null references public.event_photos (id) on delete cascade,
  event_id    text not null,
  embedding   extensions.vector(128) not null,
  created_at  timestamptz not null default now()
);
create index if not exists photo_faces_photo_idx on public.photo_faces (photo_id);
create index if not exists photo_faces_event_idx on public.photo_faces (event_id);

-- Approximate nearest-neighbour index (cosine). HNSW rather than ivfflat: ivfflat learns its
-- clusters from the rows present when it's built, and this table starts empty, so it would
-- quietly miss matches until someone remembers to rebuild it. HNSW stays accurate as photos
-- are added, with no maintenance. Both are free on Supabase.
drop index if exists public.photo_faces_embedding_ivfflat;  -- from the first draft of this script
create index if not exists photo_faces_embedding_hnsw
  on public.photo_faces
  using hnsw (embedding extensions.vector_cosine_ops);

-- Best-matching face per photo, above the threshold, best first
create or replace function public.match_attendee_photos(
  query_embedding  extensions.vector(128),
  match_threshold  double precision default 0.93,
  match_count      integer          default 50,
  filter_event_id  text             default null
)
returns table (
  photo_id       uuid,
  event_id       text,
  thumbnail_url  text,
  drive_file_id  text,
  similarity     double precision
)
language sql
stable
security invoker
set search_path = public, extensions
set hnsw.ef_search = 100   -- candidates examined per search: higher = better recall, slower
as $$
  with nearest as (
    select f.photo_id,
           1 - (f.embedding <=> query_embedding) as similarity
      from public.photo_faces f
     where filter_event_id is null or f.event_id = filter_event_id
     order by f.embedding <=> query_embedding
     limit least(greatest(match_count, 1), 200) * 4
  ),
  best as (
    select n.photo_id, max(n.similarity) as similarity
      from nearest n
     where n.similarity >= match_threshold
     group by n.photo_id
  )
  select p.id, p.event_id, p.thumbnail_url, p.drive_file_id, b.similarity
    from best b
    join public.event_photos p on p.id = b.photo_id
   order by b.similarity desc
   limit least(greatest(match_count, 1), 200);
$$;

-- Face embeddings are biometric data: nothing is readable with the public anon key.
-- Only the EvntCult server and the import script (service_role key) can touch them.
alter table public.event_photos enable row level security;
alter table public.photo_faces  enable row level security;

revoke all on function public.match_attendee_photos(extensions.vector, double precision, integer, text)
  from public, anon, authenticated;
grant execute on function public.match_attendee_photos(extensions.vector, double precision, integer, text)
  to service_role;

-- Public bucket for the small preview thumbnails the import script makes
-- (thumbnails only; full-size originals stay in Google Drive).
insert into storage.buckets (id, name, public)
values ('event-thumbs', 'event-thumbs', true)
on conflict (id) do nothing;
