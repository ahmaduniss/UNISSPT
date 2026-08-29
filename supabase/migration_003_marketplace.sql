-- UNISS: client accounts + trainer marketplace
-- Run this once in the Supabase SQL Editor, after migration.sql and migration_002_performance.sql.

-- === profiles.role =======================================================
alter table public.profiles add column if not exists role text not null default 'trainer'
  check (role in ('trainer', 'client'));

-- === clients.user_id: links a roster row to a real client account =======
-- Plain (non-partial) unique constraint: Postgres treats NULLs as distinct,
-- so trainer-authored rows (user_id null) are unaffected, while this still
-- lets `upsert(..., { onConflict: 'trainer_id,user_id' })` target real links.
alter table public.clients add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.clients drop constraint if exists clients_trainer_user_unique;
alter table public.clients add constraint clients_trainer_user_unique unique (trainer_id, user_id);

-- A linked client can read (not write) their own roster row.
drop policy if exists "linked clients read own roster row" on public.clients;
create policy "linked clients read own roster row" on public.clients
  for select using (auth.uid() = user_id);

-- === trainer_profiles: public marketplace listing ========================
create table if not exists public.trainer_profiles (
  trainer_id uuid primary key references auth.users(id) on delete cascade,
  bio text,
  specialties jsonb not null default '[]'::jsonb,
  hourly_rate numeric,
  years_experience integer,
  avatar_url text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trainer_profiles enable row level security;
drop policy if exists "trainers manage own public profile" on public.trainer_profiles;
create policy "trainers manage own public profile" on public.trainer_profiles
  for all using (auth.uid() = trainer_id) with check (auth.uid() = trainer_id);
drop policy if exists "anyone reads published profiles" on public.trainer_profiles;
create policy "anyone reads published profiles" on public.trainer_profiles
  for select using (is_public = true);

-- === booking_requests: client -> trainer connection requests ============
create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid not null references auth.users(id) on delete cascade,
  trainer_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);
create index if not exists booking_requests_trainer_idx on public.booking_requests(trainer_id);
create index if not exists booking_requests_client_idx on public.booking_requests(client_user_id);

alter table public.booking_requests enable row level security;
drop policy if exists "clients manage own sent requests" on public.booking_requests;
create policy "clients manage own sent requests" on public.booking_requests
  for all using (auth.uid() = client_user_id) with check (auth.uid() = client_user_id);
drop policy if exists "trainers manage own incoming requests" on public.booking_requests;
create policy "trainers manage own incoming requests" on public.booking_requests
  for all using (auth.uid() = trainer_id) with check (auth.uid() = trainer_id);
