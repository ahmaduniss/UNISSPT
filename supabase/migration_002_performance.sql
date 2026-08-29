-- UNISS: sport-specific performance testing
-- Run this once in the Supabase SQL Editor, after migration.sql.

-- === clients.sport =======================================================
alter table public.clients add column if not exists sport text not null default 'general'
  check (sport in ('basketball', 'track_field', 'football', 'general'));

-- === performance_tests ===================================================
create table if not exists public.performance_tests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  trainer_id uuid not null references auth.users(id) on delete cascade,
  metric_id text not null,
  metric_name text not null,
  unit text not null,
  value numeric not null,
  recorded_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists performance_tests_client_id_idx on public.performance_tests(client_id);

alter table public.performance_tests enable row level security;
drop policy if exists "trainers manage own performance tests" on public.performance_tests;
create policy "trainers manage own performance tests" on public.performance_tests
  for all using (auth.uid() = trainer_id) with check (auth.uid() = trainer_id);
