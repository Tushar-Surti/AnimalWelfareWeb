-- ============================================================================
-- A.W.W. Helpers — 0008 · proximity search
-- PostgREST cannot express ST_DWithin, so every "near me" query is an RPC.
-- All of them take a point + radius and return rows already sorted by distance
-- with distance_km attached, so the UI never recomputes it.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Rescues near a point
-- ---------------------------------------------------------------------------
create or replace function nearby_rescues(
  p_lat       double precision,
  p_lng       double precision,
  p_radius_km double precision default 10,
  p_statuses  rescue_status[] default null,
  p_species   species[] default null,
  p_urgency   urgency[] default null,
  p_limit     integer default 50,
  p_offset    integer default 0
)
returns table (
  id            uuid,
  reference     text,
  title         text,
  description   text,
  species       species,
  urgency       urgency,
  status        rescue_status,
  photos        text[],
  address       text,
  city          text,
  pincode       text,
  lat           double precision,
  lng           double precision,
  claimed_by    uuid,
  claimed_by_name text,
  created_at    timestamptz,
  distance_km   double precision,
  total_count   bigint
) language sql stable set search_path = public, extensions as $$
  with origin as (
    select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as g
  ), filtered as (
    select r.*, st_distance(r.location, o.g) as metres
    from rescues r, origin o
    where r.location is not null
      and st_dwithin(r.location, o.g, p_radius_km * 1000)
      and (p_statuses is null or r.status = any(p_statuses))
      and (p_species  is null or r.species = any(p_species))
      and (p_urgency  is null or r.urgency = any(p_urgency))
  )
  select f.id, f.reference, f.title, f.description, f.species, f.urgency, f.status,
         f.photos, f.address, f.city, f.pincode, f.lat, f.lng,
         f.claimed_by, org.name,
         f.created_at,
         round((f.metres / 1000)::numeric, 2)::double precision,
         count(*) over ()
  from filtered f
  left join organizations org on org.id = f.claimed_by
  -- Critical cases jump the queue regardless of distance; ties break by proximity.
  order by (f.urgency = 'critical') desc, f.metres asc
  limit greatest(p_limit, 0) offset greatest(p_offset, 0);
$$;

-- ---------------------------------------------------------------------------
-- Adoptable animals near a point
-- ---------------------------------------------------------------------------
create or replace function nearby_animals(
  p_lat       double precision,
  p_lng       double precision,
  p_radius_km double precision default 25,
  p_species   species[] default null,
  p_sex       sex[] default null,
  p_size      size_class[] default null,
  p_max_age_months integer default null,
  p_limit     integer default 24,
  p_offset    integer default 0
)
returns table (
  id           uuid,
  org_id       uuid,
  org_name     text,
  org_slug     text,
  org_verified boolean,
  name         text,
  slug         text,
  species      species,
  breed        text,
  sex          sex,
  age_months   integer,
  size         size_class,
  story        text,
  personality  text[],
  photos       text[],
  vaccinated   boolean,
  sterilised   boolean,
  adoption_fee numeric,
  foster_only  boolean,
  city         text,
  lat          double precision,
  lng          double precision,
  created_at   timestamptz,
  distance_km  double precision,
  total_count  bigint
) language sql stable set search_path = public, extensions as $$
  with origin as (
    select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as g
  ), filtered as (
    select a.*, st_distance(a.location, o.g) as metres
    from animals a, origin o
    where a.status = 'available'
      and a.location is not null
      and st_dwithin(a.location, o.g, p_radius_km * 1000)
      and (p_species is null or a.species = any(p_species))
      and (p_sex     is null or a.sex = any(p_sex))
      and (p_size    is null or a.size = any(p_size))
      and (p_max_age_months is null or coalesce(a.age_months, 0) <= p_max_age_months)
  )
  select f.id, f.org_id, org.name, org.slug, org.verified,
         f.name, f.slug, f.species, f.breed, f.sex, f.age_months, f.size,
         f.story, f.personality, f.photos, f.vaccinated, f.sterilised,
         f.adoption_fee, f.foster_only, f.city, f.lat, f.lng, f.created_at,
         round((f.metres / 1000)::numeric, 2)::double precision,
         count(*) over ()
  from filtered f
  join organizations org on org.id = f.org_id
  order by f.metres asc, f.created_at desc
  limit greatest(p_limit, 0) offset greatest(p_offset, 0);
$$;

-- ---------------------------------------------------------------------------
-- Organizations near a point
-- ---------------------------------------------------------------------------
create or replace function nearby_organizations(
  p_lat       double precision,
  p_lng       double precision,
  p_radius_km double precision default 25,
  p_accepts_rescues boolean default null,
  p_limit     integer default 30,
  p_offset    integer default 0
)
returns table (
  id              uuid,
  name            text,
  slug            text,
  tagline         text,
  logo_url        text,
  cover_url       text,
  phone           text,
  email           text,
  city            text,
  pincode         text,
  services        text[],
  verified        boolean,
  accepts_rescues boolean,
  lat             double precision,
  lng             double precision,
  distance_km     double precision,
  total_count     bigint
) language sql stable set search_path = public, extensions as $$
  with origin as (
    select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as g
  ), filtered as (
    select o.*, st_distance(o.location, orig.g) as metres
    from organizations o, origin orig
    where o.location is not null
      and st_dwithin(o.location, orig.g, p_radius_km * 1000)
      and (p_accepts_rescues is null or o.accepts_rescues = p_accepts_rescues)
  )
  select f.id, f.name, f.slug, f.tagline, f.logo_url, f.cover_url, f.phone, f.email,
         f.city, f.pincode, f.services, f.verified, f.accepts_rescues, f.lat, f.lng,
         round((f.metres / 1000)::numeric, 2)::double precision,
         count(*) over ()
  from filtered f
  -- Verified organizations surface first so a panicking reporter calls a real one.
  order by f.verified desc, f.metres asc
  limit greatest(p_limit, 0) offset greatest(p_offset, 0);
$$;

-- ---------------------------------------------------------------------------
-- Lost & found board near a point
-- ---------------------------------------------------------------------------
create or replace function nearby_lost_found(
  p_lat       double precision,
  p_lng       double precision,
  p_radius_km double precision default 15,
  p_kind      post_kind default null,
  p_species   species[] default null,
  p_limit     integer default 30,
  p_offset    integer default 0
)
returns table (
  id            uuid,
  kind          post_kind,
  pet_name      text,
  species       species,
  breed         text,
  colour        text,
  description   text,
  photos        text[],
  seen_at       timestamptz,
  city          text,
  lat           double precision,
  lng           double precision,
  contact_phone text,
  reward        numeric,
  status        post_status,
  created_at    timestamptz,
  distance_km   double precision,
  total_count   bigint
) language sql stable set search_path = public, extensions as $$
  with origin as (
    select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as g
  ), filtered as (
    select p.*, st_distance(p.location, o.g) as metres
    from lost_found_posts p, origin o
    where p.status = 'open'
      and p.location is not null
      and st_dwithin(p.location, o.g, p_radius_km * 1000)
      and (p_kind    is null or p.kind = p_kind)
      and (p_species is null or p.species = any(p_species))
  )
  select f.id, f.kind, f.pet_name, f.species, f.breed, f.colour, f.description,
         f.photos, f.seen_at, f.city, f.lat, f.lng, f.contact_phone, f.reward,
         f.status, f.created_at,
         round((f.metres / 1000)::numeric, 2)::double precision,
         count(*) over ()
  from filtered f
  order by f.seen_at desc, f.metres asc
  limit greatest(p_limit, 0) offset greatest(p_offset, 0);
$$;

-- ---------------------------------------------------------------------------
-- Volunteer opportunities near a point (remote listings always included)
-- ---------------------------------------------------------------------------
create or replace function nearby_opportunities(
  p_lat       double precision,
  p_lng       double precision,
  p_radius_km double precision default 25,
  p_limit     integer default 24,
  p_offset    integer default 0
)
returns table (
  id          uuid,
  org_id      uuid,
  org_name    text,
  org_slug    text,
  org_logo    text,
  title       text,
  description text,
  skills      text[],
  commitment  text,
  starts_at   timestamptz,
  ends_at     timestamptz,
  slots       integer,
  filled      integer,
  remote      boolean,
  city        text,
  lat         double precision,
  lng         double precision,
  status      opportunity_status,
  distance_km double precision,
  total_count bigint
) language sql stable set search_path = public, extensions as $$
  with origin as (
    select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as g
  ), filtered as (
    select v.*,
           case when v.location is null then null
                else st_distance(v.location, o.g) end as metres
    from volunteer_opportunities v, origin o
    where v.status <> 'closed'
      and (
        v.remote
        or (v.location is not null and st_dwithin(v.location, o.g, p_radius_km * 1000))
      )
  )
  select f.id, f.org_id, org.name, org.slug, org.logo_url,
         f.title, f.description, f.skills, f.commitment, f.starts_at, f.ends_at,
         f.slots, f.filled, f.remote, f.city, f.lat, f.lng, f.status,
         round((f.metres / 1000)::numeric, 2)::double precision,
         count(*) over ()
  from filtered f
  join organizations org on org.id = f.org_id
  order by f.metres asc nulls last, f.starts_at asc nulls last
  limit greatest(p_limit, 0) offset greatest(p_offset, 0);
$$;

-- ---------------------------------------------------------------------------
-- Impact counters for the landing page
-- ---------------------------------------------------------------------------
create or replace function platform_stats()
returns table (
  rescues_total    bigint,
  rescues_resolved bigint,
  animals_adopted  bigint,
  animals_waiting  bigint,
  organizations    bigint,
  volunteers       bigint,
  pets_reunited    bigint,
  funds_raised     numeric
) language sql stable set search_path = public, extensions as $$
  select
    (select count(*) from rescues),
    (select count(*) from rescues where status = 'resolved'),
    (select count(*) from animals where status = 'adopted'),
    (select count(*) from animals where status = 'available'),
    (select count(*) from organizations where verified),
    (select count(distinct profile_id) from volunteer_applications where status = 'approved'),
    (select count(*) from lost_found_posts where status = 'reunited'),
    (select coalesce(sum(amount), 0) from donations where status = 'succeeded');
$$;
