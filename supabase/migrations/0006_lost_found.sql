-- ============================================================================
-- A.W.W. Helpers — 0006 · lost & found
-- Two sides of the same board: "I lost my cat" and "I found a cat". Matching
-- is geographic + species, so both live in one table with a `kind` discriminator.
-- ============================================================================

do $$ begin
  create type post_kind as enum ('lost', 'found');
exception when duplicate_object then null; end $$;

do $$ begin
  create type post_status as enum ('open', 'reunited', 'closed');
exception when duplicate_object then null; end $$;

create table if not exists lost_found_posts (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid references profiles(id) on delete set null,
  kind           post_kind not null,
  pet_name       text,
  species        species not null default 'dog',
  breed          text,
  colour         text,
  sex            sex not null default 'unknown',
  description    text not null,
  distinguishing text,
  photos         text[] not null default '{}',
  seen_at        timestamptz not null default now(),
  address        text,
  city           text,
  pincode        text,
  lat            double precision,
  lng            double precision,
  location       geography(Point, 4326),
  contact_name   text,
  contact_phone  text not null,
  reward         numeric(10, 2),
  status         post_status not null default 'open',
  reunited_with  uuid references lost_found_posts(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger lost_found_updated_at before update on lost_found_posts
  for each row execute function set_updated_at();
create trigger lost_found_location before insert or update on lost_found_posts
  for each row execute function sync_location();

create index if not exists lost_found_location_idx on lost_found_posts using gist (location);
create index if not exists lost_found_kind_idx on lost_found_posts (kind, status);
create index if not exists lost_found_species_idx on lost_found_posts (species);
create index if not exists lost_found_created_idx on lost_found_posts (created_at desc);

-- Candidate matches for one post: the opposite kind, same species, still open,
-- nearby, and seen within a plausible window. Ranked by distance.
create or replace function match_lost_found(p_post_id uuid, p_radius_km double precision default 15)
returns table (
  id            uuid,
  kind          post_kind,
  pet_name      text,
  species       species,
  breed         text,
  colour        text,
  photos        text[],
  seen_at       timestamptz,
  city          text,
  lat           double precision,
  lng           double precision,
  contact_phone text,
  distance_km   double precision
) language sql stable set search_path = public, extensions as $$
  with source as (
    select * from lost_found_posts where id = p_post_id
  )
  select p.id, p.kind, p.pet_name, p.species, p.breed, p.colour, p.photos,
         p.seen_at, p.city, p.lat, p.lng, p.contact_phone,
         round((st_distance(p.location, s.location) / 1000)::numeric, 2)::double precision
  from lost_found_posts p, source s
  where p.kind <> s.kind
    and p.species = s.species
    and p.status = 'open'
    and p.location is not null
    and s.location is not null
    and st_dwithin(p.location, s.location, p_radius_km * 1000)
    -- A "found" post can only explain a "lost" post reported before it.
    and p.seen_at between s.seen_at - interval '45 days' and s.seen_at + interval '45 days'
  order by st_distance(p.location, s.location)
  limit 25;
$$;
