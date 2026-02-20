-- Supabase schema for AgriInputs (POD + Inventory + Distributions)
-- Paste into Supabase SQL Editor and run.
-- NOTE: This enables RLS; for quick testing you can disable RLS or adjust policies.

create extension if not exists pgcrypto;

create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select coalesce((select role from public.profiles where user_id = auth.uid()), 'officer');
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
as $$
  select public.current_user_role() in ('manager','admin_store','me_manager');
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'officer',
  location text,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);

create table if not exists public.beneficiaries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  "group" text,
  village text,
  phone text,
  gender text,
  count int,
  rating numeric,
  avatar text,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  barcode text unique not null,
  name text not null,
  cat text,
  unit text,
  qty numeric not null default 0,
  qty_expected numeric default 0,
  qty_distributed numeric not null default 0,
  qty_reserved numeric not null default 0,
  min numeric not null default 0,
  supplier text,
  cost numeric not null default 0,
  loc text,
  expiry date,
  proc_code text,
  proc_date date,
  received_date date,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_proc_code on public.inventory_items(proc_code);
create index if not exists idx_inventory_cat on public.inventory_items(cat);

create table if not exists public.distributions (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null,
  date date not null,
  bene_id uuid references public.beneficiaries(id) on delete set null,
  season text,
  officer text,
  truck text,
  status text not null default 'Unassigned',
  priority text default 'Medium',
  rate numeric default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.distribution_items (
  id uuid primary key default gen_random_uuid(),
  distribution_id uuid not null references public.distributions(id) on delete cascade,
  inv_item_id uuid not null references public.inventory_items(id) on delete restrict,
  qty_ordered numeric not null,
  created_at timestamptz not null default now(),
  unique(distribution_id, inv_item_id)
);

create index if not exists idx_dist_items_dist on public.distribution_items(distribution_id);

create table if not exists public.pods (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null,
  dist_ref text not null,
  distribution_id uuid references public.distributions(id) on delete set null,
  bene_id uuid references public.beneficiaries(id) on delete set null,
  date date not null,
  time text,
  officer text,
  vehicle text,
  season text,
  received_by text not null,
  condition text not null default 'Good',
  signed_at text,
  notes text,
  gps_lat numeric,
  gps_lng numeric,
  gps_accuracy numeric,
  signature_data_url text,
  photo_urls text[],
  verified boolean not null default false,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_pods_dist_ref on public.pods(dist_ref);
create index if not exists idx_pods_bene on public.pods(bene_id);
create index if not exists idx_pods_verified on public.pods(verified);

create table if not exists public.pod_items (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pods(id) on delete cascade,
  inv_item_id uuid references public.inventory_items(id) on delete set null,
  barcode text,
  name text,
  proc_code text,
  cat text,
  unit text,
  qty_ordered numeric,
  qty_received numeric not null,
  item_condition text default 'Good',
  damage_note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_pod_items_pod on public.pod_items(pod_id);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.beneficiaries enable row level security;
alter table public.inventory_items enable row level security;
alter table public.distributions enable row level security;
alter table public.distribution_items enable row level security;
alter table public.pods enable row level security;
alter table public.pod_items enable row level security;
alter table public.audit_logs enable row level security;

-- PROFILES
drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own" on public.profiles
for select to authenticated
using (user_id = auth.uid());

-- Allow managers/store admins/M&E managers to view all profiles (for user administration)
drop policy if exists "profiles_read_admins" on public.profiles;
create policy "profiles_read_admins" on public.profiles
for select to authenticated
using (public.current_user_role() in ('manager','admin_store','me_manager'));

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own" on public.profiles
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Allow admins to update roles for any profile (user administration)
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
for update to authenticated
using (public.current_user_role() in ('manager','admin_store','me_manager'))
with check (public.current_user_role() in ('manager','admin_store','me_manager'));

-- BENEFICIARIES (read all authenticated; write only managers)
drop policy if exists "bene_read_all" on public.beneficiaries;
create policy "bene_read_all" on public.beneficiaries
for select to authenticated
using (true);

drop policy if exists "bene_write_managers" on public.beneficiaries;
create policy "bene_write_managers" on public.beneficiaries
for all to authenticated
using (public.is_manager())
with check (public.is_manager());

-- INVENTORY (read all authenticated; write managers + store)
drop policy if exists "inv_read_all" on public.inventory_items;
create policy "inv_read_all" on public.inventory_items
for select to authenticated
using (true);

drop policy if exists "inv_write_managers" on public.inventory_items;
create policy "inv_write_managers" on public.inventory_items
for all to authenticated
using (public.current_user_role() in ('manager','admin_store','procurement'))
with check (public.current_user_role() in ('manager','admin_store','procurement'));

-- DISTRIBUTIONS (read all authenticated; write managers)
drop policy if exists "dist_read_all" on public.distributions;
create policy "dist_read_all" on public.distributions
for select to authenticated
using (true);

drop policy if exists "dist_write_managers" on public.distributions;
create policy "dist_write_managers" on public.distributions
for all to authenticated
using (public.current_user_role() in ('manager','admin_store'))
with check (public.current_user_role() in ('manager','admin_store'));

-- DISTRIBUTION ITEMS
drop policy if exists "dist_items_read_all" on public.distribution_items;
create policy "dist_items_read_all" on public.distribution_items
for select to authenticated
using (true);

drop policy if exists "dist_items_write_managers" on public.distribution_items;
create policy "dist_items_write_managers" on public.distribution_items
for all to authenticated
using (public.current_user_role() in ('manager','admin_store'))
with check (public.current_user_role() in ('manager','admin_store'));

-- PODS
drop policy if exists "pods_read_all" on public.pods;
create policy "pods_read_all" on public.pods
for select to authenticated
using (true);

drop policy if exists "pods_insert_field" on public.pods;
create policy "pods_insert_field" on public.pods
for insert to authenticated
with check (public.current_user_role() in ('field_officer','manager','admin_store','me_manager','me_officer'));

drop policy if exists "pods_update_creator_or_manager" on public.pods;
create policy "pods_update_creator_or_manager" on public.pods
for update to authenticated
using (
  public.is_manager()
  or (created_by = auth.uid() and verified = false)
)
with check (
  public.is_manager()
  or (created_by = auth.uid() and verified = false)
);

drop policy if exists "pods_verify_managers" on public.pods;
create policy "pods_verify_managers" on public.pods
for update to authenticated
using (public.current_user_role() in ('manager','admin_store','me_manager','me_officer'))
with check (public.current_user_role() in ('manager','admin_store','me_manager','me_officer'));

-- POD ITEMS
drop policy if exists "pod_items_read_all" on public.pod_items;
create policy "pod_items_read_all" on public.pod_items
for select to authenticated
using (true);

drop policy if exists "pod_items_write_field_or_manager" on public.pod_items;
create policy "pod_items_write_field_or_manager" on public.pod_items
for all to authenticated
using (public.current_user_role() in ('field_officer','manager','admin_store','me_manager','me_officer'))
with check (public.current_user_role() in ('field_officer','manager','admin_store','me_manager','me_officer'));

-- AUDIT
drop policy if exists "audit_insert_all_auth" on public.audit_logs;
create policy "audit_insert_all_auth" on public.audit_logs
for insert to authenticated
with check (true);

drop policy if exists "audit_read_managers" on public.audit_logs;
create policy "audit_read_managers" on public.audit_logs
for select to authenticated
using (public.is_manager());
