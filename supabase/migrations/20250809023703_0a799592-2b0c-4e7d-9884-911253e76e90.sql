-- Create required extension
create extension if not exists pgcrypto;

-- Candidates table
create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  query text not null,
  mode text not null default 'keyword' check (mode in ('keyword','asin','sku')),
  locale text default 'US',
  seed_source text,
  dedupe_hash text,
  created_at timestamptz default now()
);

-- Signals table
create table if not exists public.signals (
  id bigserial primary key,
  candidate_id uuid references public.candidates(id) on delete cascade,
  signal_id text not null,
  raw jsonb not null,
  collected_at timestamptz default now(),
  ttl_days int default 7,
  provider text
);

-- Create unique index for one signal per day per candidate/signal_id
create unique index if not exists uniq_signals_candidate_signal_day
on public.signals (candidate_id, signal_id, (date_trunc('day', collected_at)));

-- Reports table
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.candidates(id) on delete cascade,
  indices jsonb not null,
  subscores jsonb not null,
  drivers jsonb not null,
  total_score numeric not null check (total_score >= 0 and total_score <= 1),
  confidence numeric,
  snapshot jsonb,
  computed_at timestamptz default now()
);

-- Watches table
create table if not exists public.watches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  candidate_id uuid references public.candidates(id) on delete cascade,
  cadence text default 'weekly' check (cadence in ('daily','weekly')),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Provider usage table
create table if not exists public.provider_usage (
  id bigserial primary key,
  provider text not null,
  endpoint text,
  units int default 0,
  cost_usd numeric default 0,
  window_start timestamptz default date_trunc('day', now()),
  last_spent_at timestamptz default now(),
  unique (provider, window_start)
);
