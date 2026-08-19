-- ============================================================================
-- A.W.W. Helpers — 0005 · volunteering
-- ============================================================================

do $$ begin
  create type opportunity_status as enum ('open', 'filled', 'closed');
exception when duplicate_object then null; end $$;

create table if not exists volunteer_opportunities (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  title       text not null,
  description text not null,
  skills      text[] not null default '{}',
  commitment  text,
  starts_at   timestamptz,
  ends_at     timestamptz,
  slots       integer not null default 1 check (slots > 0),
  filled      integer not null default 0 check (filled >= 0),
  remote      boolean not null default false,
  address     text,
  city        text,
  pincode     text,
  lat         double precision,
  lng         double precision,
  location    geography(Point, 4326),
  status      opportunity_status not null default 'open',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger volunteer_opportunities_updated_at before update on volunteer_opportunities
  for each row execute function set_updated_at();
create trigger volunteer_opportunities_location before insert or update on volunteer_opportunities
  for each row execute function sync_location();

create index if not exists opportunities_location_idx on volunteer_opportunities using gist (location);
create index if not exists opportunities_status_idx on volunteer_opportunities (status);
create index if not exists opportunities_org_idx on volunteer_opportunities (org_id);

create table if not exists volunteer_applications (
  id             uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references volunteer_opportunities(id) on delete cascade,
  profile_id     uuid not null references profiles(id) on delete cascade,
  full_name      text not null,
  phone          text not null,
  email          text not null,
  message        text,
  availability   text,
  status         application_status not null default 'submitted',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (opportunity_id, profile_id)
);

create trigger volunteer_applications_updated_at before update on volunteer_applications
  for each row execute function set_updated_at();

create index if not exists volunteer_applications_opportunity_idx on volunteer_applications (opportunity_id);
create index if not exists volunteer_applications_profile_idx on volunteer_applications (profile_id);

-- Keep the "3 of 5 spots left" counter truthful, and close the listing when full.
create or replace function volunteer_sync_slots()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target uuid := coalesce(new.opportunity_id, old.opportunity_id);
begin
  update public.volunteer_opportunities o
  set filled = agg.count,
      status = case
                 when o.status = 'open'   and agg.count >= o.slots then 'filled'
                 when o.status = 'filled' and agg.count <  o.slots then 'open'
                 else o.status
               end
  from (
    select count(*)::int as count
    from public.volunteer_applications
    where opportunity_id = target and status = 'approved'
  ) agg
  where o.id = target;
  return null;
end $$;

drop trigger if exists volunteer_applications_rollup on volunteer_applications;
create trigger volunteer_applications_rollup
  after insert or update or delete on volunteer_applications
  for each row execute function volunteer_sync_slots();
