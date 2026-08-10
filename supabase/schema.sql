-- Vouch client portal schema
-- Run once against the project's Postgres database (executed via the
-- Supabase Management API during initial setup). Safe to re-run: uses
-- IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS guards.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('client','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key references public.profiles(id) on delete cascade,
  business_name text,
  category text,
  address text,
  phone text,
  status text not null default 'active' check (status in ('active','pending_cancellation','cancelled')),
  docuseal_submission_slug text,
  contract_signed_at timestamptz,
  created_at timestamptz not null default now()
);

-- business_name used to be required at signup. Onboarding now only
-- requires an email; business details are filled in after the client's
-- contract comes back, so this can no longer be NOT NULL.
alter table public.clients alter column business_name drop not null;

-- The client's per-submission DocuSeal slug (embedded in the portal to
-- sign, and shown again read-only afterward) and when they completed it.
alter table public.clients add column if not exists docuseal_submission_slug text;
alter table public.clients add column if not exists contract_signed_at timestamptz;

create table if not exists public.billing (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  plan_name text not null default 'Management',
  monthly_amount numeric,
  addon_platforms text[] not null default '{}',
  next_billing_date date,
  status text not null default 'active' check (status in ('active','pending_cancellation','cancelled')),
  updated_at timestamptz not null default now()
);

create table if not exists public.performance_stats (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  period_label text not null,
  rating numeric,
  review_count int,
  new_reviews int,
  response_rate numeric,
  profile_views int,
  recorded_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  reason text,
  status text not null default 'pending' check (status in ('pending','acknowledged','completed')),
  created_at timestamptz not null default now()
);

create index if not exists billing_client_id_idx on public.billing(client_id);
create index if not exists performance_stats_client_id_idx on public.performance_stats(client_id);
create index if not exists cancellation_requests_client_id_idx on public.cancellation_requests(client_id);

-- SECURITY DEFINER so it can read profiles regardless of the caller's RLS,
-- without causing recursive-policy evaluation on profiles itself.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.billing enable row level security;
alter table public.performance_stats enable row level security;
alter table public.cancellation_requests enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_admin_write" on public.profiles;
create policy "profiles_admin_write" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "clients_select_own_or_admin" on public.clients;
create policy "clients_select_own_or_admin" on public.clients
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "clients_admin_insert" on public.clients;
create policy "clients_admin_insert" on public.clients
  for insert with check (public.is_admin());

drop policy if exists "clients_admin_update" on public.clients;
create policy "clients_admin_update" on public.clients
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "clients_admin_delete" on public.clients;
create policy "clients_admin_delete" on public.clients
  for delete using (public.is_admin());

drop policy if exists "billing_select_own_or_admin" on public.billing;
create policy "billing_select_own_or_admin" on public.billing
  for select using (client_id = auth.uid() or public.is_admin());

drop policy if exists "billing_admin_insert" on public.billing;
create policy "billing_admin_insert" on public.billing
  for insert with check (public.is_admin());

drop policy if exists "billing_admin_update" on public.billing;
create policy "billing_admin_update" on public.billing
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "billing_admin_delete" on public.billing;
create policy "billing_admin_delete" on public.billing
  for delete using (public.is_admin());

drop policy if exists "stats_select_own_or_admin" on public.performance_stats;
create policy "stats_select_own_or_admin" on public.performance_stats
  for select using (client_id = auth.uid() or public.is_admin());

drop policy if exists "stats_admin_insert" on public.performance_stats;
create policy "stats_admin_insert" on public.performance_stats
  for insert with check (public.is_admin());

drop policy if exists "stats_admin_update" on public.performance_stats;
create policy "stats_admin_update" on public.performance_stats
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "stats_admin_delete" on public.performance_stats;
create policy "stats_admin_delete" on public.performance_stats
  for delete using (public.is_admin());

drop policy if exists "cancel_select_own_or_admin" on public.cancellation_requests;
create policy "cancel_select_own_or_admin" on public.cancellation_requests
  for select using (client_id = auth.uid() or public.is_admin());

drop policy if exists "cancel_insert_own" on public.cancellation_requests;
create policy "cancel_insert_own" on public.cancellation_requests
  for insert with check (client_id = auth.uid());

drop policy if exists "cancel_admin_update" on public.cancellation_requests;
create policy "cancel_admin_update" on public.cancellation_requests
  for update using (public.is_admin()) with check (public.is_admin());

-- Admin-editable key/value config, e.g. which DocuSeal template to send
-- on client onboarding. Lets staff swap the contract from the admin
-- portal without a code deploy.
create table if not exists public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_admin_all" on public.app_settings;
create policy "app_settings_admin_all" on public.app_settings
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.app_settings (key, value)
values ('docuseal_template_id', '5375399')
on conflict (key) do nothing;
