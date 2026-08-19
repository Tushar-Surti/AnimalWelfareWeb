-- ============================================================================
-- A.W.W. Helpers — 0004 · fundraising
-- Campaigns keep a denormalised raised_amount so listing pages never have to
-- aggregate the donations table; a trigger keeps it exact.
-- ============================================================================

do $$ begin
  create type campaign_status as enum ('draft', 'active', 'funded', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type donation_status as enum ('pending', 'succeeded', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

create table if not exists campaigns (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  animal_id     uuid references animals(id) on delete set null,
  rescue_id     uuid references rescues(id) on delete set null,
  title         text not null,
  slug          text not null unique,
  summary       text not null,
  story         text not null,
  cover_url     text,
  photos        text[] not null default '{}',
  goal_amount   numeric(12, 2) not null check (goal_amount > 0),
  raised_amount numeric(12, 2) not null default 0,
  currency      text not null default 'INR',
  donor_count   integer not null default 0,
  deadline      date,
  status        campaign_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger campaigns_updated_at before update on campaigns
  for each row execute function set_updated_at();

create index if not exists campaigns_org_idx on campaigns (org_id);
create index if not exists campaigns_status_idx on campaigns (status);
create index if not exists campaigns_created_idx on campaigns (created_at desc);

create table if not exists donations (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  -- Nullable so guests can give without an account.
  donor_id      uuid references profiles(id) on delete set null,
  donor_name    text,
  donor_email   text,
  amount        numeric(12, 2) not null check (amount > 0),
  currency      text not null default 'INR',
  message       text,
  anonymous     boolean not null default false,
  status        donation_status not null default 'pending',
  -- Payment-gateway fields. The reference implementation records intents and
  -- confirms them server-side; swapping in Razorpay/Stripe means writing to
  -- these same two columns.
  provider      text not null default 'manual',
  provider_ref  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger donations_updated_at before update on donations
  for each row execute function set_updated_at();

create index if not exists donations_campaign_idx on donations (campaign_id, created_at desc);
create index if not exists donations_donor_idx on donations (donor_id);
create unique index if not exists donations_provider_ref_idx
  on donations (provider, provider_ref) where provider_ref is not null;

-- Only money that actually cleared counts toward the total.
create or replace function donations_sync_campaign()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target uuid := coalesce(new.campaign_id, old.campaign_id);
begin
  update public.campaigns c
  set raised_amount = coalesce(agg.total, 0),
      donor_count   = coalesce(agg.count, 0),
      status        = case
                        when c.status = 'active' and coalesce(agg.total, 0) >= c.goal_amount then 'funded'
                        else c.status
                      end
  from (
    select sum(amount) as total, count(*) as count
    from public.donations
    where campaign_id = target and status = 'succeeded'
  ) agg
  where c.id = target;
  return null;
end $$;

drop trigger if exists donations_rollup on donations;
create trigger donations_rollup
  after insert or update or delete on donations
  for each row execute function donations_sync_campaign();
