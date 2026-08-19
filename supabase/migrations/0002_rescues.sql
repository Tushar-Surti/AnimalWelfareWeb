-- ============================================================================
-- A.W.W. Helpers — 0002 · rescues
-- The core loop: someone spots an animal in trouble, an organization claims it,
-- and everyone watching gets a public timeline of what happened next.
-- ============================================================================

create table if not exists rescues (
  id             uuid primary key default gen_random_uuid(),
  -- Nullable: a stranger who finds a bleeding dog should not have to sign up
  -- first. Anonymous reports still carry a contact number.
  reporter_id    uuid references profiles(id) on delete set null,
  reference      text not null unique default ('AWW-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6))),
  title          text not null,
  description    text not null,
  species        species not null default 'other',
  urgency        urgency not null default 'urgent',
  status         rescue_status not null default 'reported',
  photos         text[] not null default '{}',
  address        text,
  landmark       text,
  city           text,
  pincode        text,
  lat            double precision,
  lng            double precision,
  location       geography(Point, 4326),
  contact_name   text,
  contact_phone  text not null,
  claimed_by     uuid references organizations(id) on delete set null,
  claimed_at     timestamptz,
  resolved_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger rescues_updated_at before update on rescues
  for each row execute function set_updated_at();
create trigger rescues_location before insert or update on rescues
  for each row execute function sync_location();

create index if not exists rescues_location_idx on rescues using gist (location);
create index if not exists rescues_status_idx on rescues (status);
create index if not exists rescues_urgency_idx on rescues (urgency);
create index if not exists rescues_created_idx on rescues (created_at desc);
create index if not exists rescues_claimed_by_idx on rescues (claimed_by);
create index if not exists rescues_reporter_idx on rescues (reporter_id);
create index if not exists rescues_pincode_idx on rescues (pincode);

-- ---------------------------------------------------------------------------
-- rescue_updates — the public timeline
-- ---------------------------------------------------------------------------
create table if not exists rescue_updates (
  id          uuid primary key default gen_random_uuid(),
  rescue_id   uuid not null references rescues(id) on delete cascade,
  author_id   uuid references profiles(id) on delete set null,
  org_id      uuid references organizations(id) on delete set null,
  message     text not null,
  photos      text[] not null default '{}',
  status_from rescue_status,
  status_to   rescue_status,
  created_at  timestamptz not null default now()
);

create index if not exists rescue_updates_rescue_idx on rescue_updates (rescue_id, created_at);

-- Every status change writes its own timeline entry, so history can never
-- silently diverge from the current status.
create or replace function rescues_log_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.rescue_updates (rescue_id, org_id, message, status_from, status_to)
    values (
      new.id,
      new.claimed_by,
      case new.status
        when 'claimed'  then 'An organization is on the way.'
        when 'in_care'  then 'This animal is now safe and receiving care.'
        when 'resolved' then 'Happy ending — this rescue is complete.'
        when 'closed'   then 'This report was closed.'
        else 'Status updated.'
      end,
      old.status,
      new.status
    );
  end if;
  return new;
end $$;

drop trigger if exists rescues_status_timeline on rescues;
create trigger rescues_status_timeline
  after update of status on rescues
  for each row execute function rescues_log_status_change();

-- ---------------------------------------------------------------------------
-- rescue_watchers — "ping me when this one gets a happy ending"
-- ---------------------------------------------------------------------------
create table if not exists rescue_watchers (
  rescue_id  uuid not null references rescues(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (rescue_id, profile_id)
);

create index if not exists rescue_watchers_profile_idx on rescue_watchers (profile_id);
