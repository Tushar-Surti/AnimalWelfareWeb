-- ============================================================================
-- A.W.W. Helpers — 0001 · foundations
-- Extensions, shared enums, helper functions, profiles & organizations.
-- ============================================================================

-- Supabase keeps extensions out of `public`. Install them into `extensions`
-- and make sure every function below can still resolve `geography`, ST_*, and
-- the trigram operators by naming that schema in its search_path explicitly.
create schema if not exists extensions;
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "postgis"  with schema extensions;
create extension if not exists "pg_trgm"  with schema extensions;

-- Persist the path for future sessions. Best-effort: on a hosted project the
-- connecting role may not own the database, and that is fine — the migration
-- runner and every function below set their own search_path regardless.
do $$
begin
  execute format('alter database %I set search_path to public, extensions', current_database());
exception when insufficient_privilege then
  raise notice 'skipping database-level search_path (insufficient privilege)';
end $$;

set search_path to public, extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('citizen', 'ngo', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type species as enum ('dog', 'cat', 'bird', 'cattle', 'rodent', 'reptile', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type urgency as enum ('critical', 'urgent', 'stable');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rescue_status as enum ('reported', 'claimed', 'in_care', 'resolved', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type animal_status as enum ('available', 'pending', 'adopted', 'unavailable');
exception when duplicate_object then null; end $$;

do $$ begin
  create type application_status as enum ('submitted', 'reviewing', 'approved', 'rejected', 'withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sex as enum ('male', 'female', 'unknown');
exception when duplicate_object then null; end $$;

do $$ begin
  create type size_class as enum ('small', 'medium', 'large');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Keeps updated_at honest without the app having to remember.
create or replace function set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Every geo-aware table stores lat/lng (easy to read, easy to render) and a
-- generated geography point (indexable, correct great-circle math). This trigger
-- derives the point so the app only ever writes lat/lng.
create or replace function sync_location()
returns trigger language plpgsql set search_path = public, extensions as $$
begin
  if new.lat is not null and new.lng is not null then
    new.location = st_setsrid(st_makepoint(new.lng, new.lat), 4326)::geography;
  else
    new.location = null;
  end if;
  return new;
end $$;

-- Slugify: "Happy Tails Foundation" -> "happy-tails-foundation"
create or replace function slugify(txt text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(coalesce(txt, '')), '[^a-z0-9]+', '-', 'g'));
$$;

-- ---------------------------------------------------------------------------
-- profiles — one row per auth.users row, created automatically on signup
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role not null default 'citizen',
  full_name     text,
  avatar_url    text,
  phone         text,
  bio           text,
  city          text,
  pincode       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Mirror new auth users into profiles. Metadata passed at signup time
-- (full_name / role) is picked up here so the app never needs a second write.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'citizen')::user_role,
    nullif(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- organizations — NGOs, shelters, clinics, independent rescuer collectives
-- ---------------------------------------------------------------------------
create table if not exists organizations (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references profiles(id) on delete cascade,
  name            text not null,
  slug            text not null unique,
  tagline         text,
  description     text,
  email           text not null,
  phone           text,
  website         text,
  logo_url        text,
  cover_url       text,
  registration_no text,
  address_line1   text,
  address_line2   text,
  landmark        text,
  city            text,
  state           text,
  pincode         text,
  lat             double precision,
  lng             double precision,
  location        geography(Point, 4326),
  services        text[] not null default '{}',
  accepts_rescues boolean not null default true,
  verified        boolean not null default false,
  verified_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger organizations_updated_at before update on organizations
  for each row execute function set_updated_at();
create trigger organizations_location before insert or update on organizations
  for each row execute function sync_location();

create index if not exists organizations_location_idx on organizations using gist (location);
create index if not exists organizations_city_idx on organizations (lower(city));
create index if not exists organizations_name_trgm_idx on organizations using gin (name gin_trgm_ops);

-- Multiple humans can staff one organization.
create table if not exists organization_members (
  org_id     uuid not null references organizations(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (org_id, profile_id)
);

create index if not exists organization_members_profile_idx on organization_members (profile_id);

-- The creator is always a member; saves a round trip at signup.
create or replace function organizations_add_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.organization_members (org_id, profile_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists organizations_owner_membership on organizations;
create trigger organizations_owner_membership
  after insert on organizations
  for each row execute function organizations_add_owner();
