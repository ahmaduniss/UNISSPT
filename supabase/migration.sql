-- UNISS: gym app -> PT app migration
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query).
-- Old gym-social tables (leaderboard_entries, social_posts, post_likes,
-- competitions, competition_participants, shared_routines) are left untouched.
-- They're unused by the new app and safe to drop later by hand if you want to,
-- but this script does not touch them.

-- === profiles: trainer identity only ===================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Trainer',
  created_at timestamptz not null default now()
);

-- === clients: a trainer's roster ========================================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  goal text,
  notes text,
  starting_weight_kg numeric,
  status text not null default 'active' check (status in ('active', 'inactive')),
  avatar_url text,
  created_at timestamptz not null default now()
);
create index if not exists clients_trainer_id_idx on public.clients(trainer_id);

alter table public.clients enable row level security;
drop policy if exists "trainers manage own clients" on public.clients;
create policy "trainers manage own clients" on public.clients
  for all using (auth.uid() = trainer_id) with check (auth.uid() = trainer_id);

-- === workouts: repoint at clients instead of a single athlete ==========
-- If this table already exists from the old gym app, add the new columns.
create table if not exists public.workouts (
  id text primary key,
  client_id uuid references public.clients(id) on delete cascade,
  trainer_id uuid references auth.users(id) on delete cascade,
  name text not null,
  date timestamptz not null,
  duration integer not null default 0,
  total_volume numeric not null default 0,
  exercises jsonb not null default '[]'::jsonb
);
alter table public.workouts add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.workouts add column if not exists trainer_id uuid references auth.users(id) on delete cascade;
create index if not exists workouts_client_id_idx on public.workouts(client_id);

alter table public.workouts enable row level security;
drop policy if exists "trainers manage own workouts" on public.workouts;
create policy "trainers manage own workouts" on public.workouts
  for all using (auth.uid() = trainer_id) with check (auth.uid() = trainer_id);

-- === progress_photos =====================================================
create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  trainer_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  taken_at timestamptz not null default now(),
  weight_kg numeric,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists progress_photos_client_id_idx on public.progress_photos(client_id);

alter table public.progress_photos enable row level security;
drop policy if exists "trainers manage own progress photos" on public.progress_photos;
create policy "trainers manage own progress photos" on public.progress_photos
  for all using (auth.uid() = trainer_id) with check (auth.uid() = trainer_id);

-- === trainer_routines: a trainer's reusable workout templates ==========
create table if not exists public.trainer_routines (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  exercises jsonb not null default '[]'::jsonb,
  usage_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists trainer_routines_trainer_id_idx on public.trainer_routines(trainer_id);

alter table public.trainer_routines enable row level security;
drop policy if exists "trainers manage own routines" on public.trainer_routines;
create policy "trainers manage own routines" on public.trainer_routines
  for all using (auth.uid() = trainer_id) with check (auth.uid() = trainer_id);

-- === Storage bucket for progress photos =================================
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', true)
on conflict (id) do nothing;

-- Photos are uploaded to paths like "{trainer_id}/{client_id}/{filename}" —
-- restrict writes so a trainer can only write under their own folder prefix.
drop policy if exists "trainers upload own progress photos" on storage.objects;
create policy "trainers upload own progress photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "trainers delete own progress photos" on storage.objects;
create policy "trainers delete own progress photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "public read progress photos" on storage.objects;
create policy "public read progress photos" on storage.objects
  for select to public
  using (bucket_id = 'progress-photos');
