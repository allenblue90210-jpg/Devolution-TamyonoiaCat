-- ==============================================================================
-- Devolution — Standalone Digital Trust & Reputation Platform
-- Supabase PostgreSQL Schema & Migration Script
-- ==============================================================================

-- 1. Unified Application State Snapshot Table (for bi-directional zero-loss sync)
create table if not exists public.devolution_state (
  id text primary key default 'primary',
  data jsonb not null default '{}'::jsonb,
  user_count integer default 0,
  receipt_count integer default 0,
  commitment_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.devolution_state enable row level security;

-- Policy: Allow service role / secret key full read and write
create policy "Allow service role full access to devolution_state"
  on public.devolution_state
  for all
  using (true)
  with check (true);

-- 2. Users Table
create table if not exists public.devolution_users (
  id text primary key,
  username text unique not null,
  full_name text not null,
  email text,
  phone text,
  headline text,
  bio text,
  category text default 'other',
  account_type text default 'personal',
  city text,
  country text,
  reputation_score integer default 600,
  is_verified boolean default false,
  privacy_settings jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.devolution_users enable row level security;

create policy "Allow authenticated and service role read users"
  on public.devolution_users
  for select
  using (true);

create policy "Allow service role manage users"
  on public.devolution_users
  for all
  using (true)
  with check (true);

-- 3. Trust Commitments Table (Pacts & Bilateral Agreements)
-- NOTE: FK constraints removed to support external/unregistered counterparties.
-- The full pact object is stored in the 'data' JSONB column for zero-loss persistence.
create table if not exists public.devolution_commitments (
  id text primary key,
  title text not null,
  description text,
  category text not null,
  other_category_details text,
  status text not null default 'pending_acceptance',
  requester_id text not null,
  committer_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.devolution_commitments enable row level security;

create policy "Allow read commitments"
  on public.devolution_commitments
  for select
  using (true);

create policy "Allow service role manage commitments"
  on public.devolution_commitments
  for all
  using (true)
  with check (true);

-- 4. Dual-Signed Trust Receipts Table
-- NOTE: FK constraints removed to support external/unregistered counterparties.
-- The full receipt object is stored in the 'data' JSONB column for zero-loss persistence.
create table if not exists public.devolution_receipts (
  id text primary key,
  title text not null,
  description text,
  category text not null,
  amount text,
  currency text default 'NGN',
  status text not null default 'pending',
  creator_id text not null,
  counterparty_id text not null,
  data jsonb not null default '{}'::jsonb,
  creator_signed_at timestamptz,
  counterparty_signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.devolution_receipts enable row level security;

create policy "Allow read receipts"
  on public.devolution_receipts
  for select
  using (true);

create policy "Allow service role manage receipts"
  on public.devolution_receipts
  for all
  using (true)
  with check (true);

-- 5. Attested Evidence Ledger
create table if not exists public.devolution_evidence (
  id text primary key,
  user_id text not null references public.devolution_users(id) on delete cascade,
  title text not null,
  category text not null,
  issuer text,
  status text not null default 'submitted',
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.devolution_evidence enable row level security;

create policy "Allow read evidence"
  on public.devolution_evidence
  for select
  using (true);

create policy "Allow service role manage evidence"
  on public.devolution_evidence
  for all
  using (true)
  with check (true);

-- 6. Ratings & Good Faith Impressions
create table if not exists public.devolution_ratings (
  id text primary key,
  target_user_id text not null references public.devolution_users(id) on delete cascade,
  author_name text,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.devolution_ratings enable row level security;

create policy "Allow read ratings"
  on public.devolution_ratings
  for select
  using (true);

create policy "Allow service role manage ratings"
  on public.devolution_ratings
  for all
  using (true)
  with check (true);

-- Automatically update timestamps trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger on_devolution_state_update
  before update on public.devolution_state
  for each row execute function public.handle_updated_at();

create or replace trigger on_devolution_commitments_update
  before update on public.devolution_commitments
  for each row execute function public.handle_updated_at();

create or replace trigger on_devolution_receipts_update
  before update on public.devolution_receipts
  for each row execute function public.handle_updated_at();

-- Seed initial record for state synchronization
insert into public.devolution_state (id, data, user_count, receipt_count, commitment_count)
values ('primary', '{}'::jsonb, 0, 0, 0)
on conflict (id) do nothing;

-- ==============================================================================
-- MIGRATION: If tables already exist without 'data' column, add it:
-- ==============================================================================
-- ALTER TABLE public.devolution_commitments ADD COLUMN IF NOT EXISTS data jsonb not null default '{}'::jsonb;
-- ALTER TABLE public.devolution_receipts ADD COLUMN IF NOT EXISTS data jsonb not null default '{}'::jsonb;
-- 
-- If tables have FK constraints that block inserts, drop them:
-- ALTER TABLE public.devolution_commitments DROP CONSTRAINT IF EXISTS devolution_commitments_requester_id_fkey;
-- ALTER TABLE public.devolution_commitments DROP CONSTRAINT IF EXISTS devolution_commitments_committer_id_fkey;
-- ALTER TABLE public.devolution_receipts DROP CONSTRAINT IF EXISTS devolution_receipts_creator_id_fkey;
-- ALTER TABLE public.devolution_receipts DROP CONSTRAINT IF EXISTS devolution_receipts_counterparty_id_fkey;
