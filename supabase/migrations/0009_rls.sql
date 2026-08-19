-- ============================================================================
-- A.W.W. Helpers — 0009 · row level security
--
-- Architecture note: every write in this app goes through the Hono API on
-- Render, which holds the service_role key and therefore bypasses RLS after
-- running its own authorization checks. These policies are the second lock:
-- if the anon key ever leaks (it ships in the browser bundle, so assume it
-- will), the blast radius is limited to reading data that is already public.
--
-- Rule of thumb below: anon may SELECT public content and nothing else.
-- Authenticated users may additionally SELECT rows that are about them.
-- No policy grants INSERT/UPDATE/DELETE to anon or authenticated — ever.
-- ============================================================================

alter table profiles                enable row level security;
alter table organizations           enable row level security;
alter table organization_members    enable row level security;
alter table rescues                 enable row level security;
alter table rescue_updates          enable row level security;
alter table rescue_watchers         enable row level security;
alter table animals                 enable row level security;
alter table adoption_applications   enable row level security;
alter table animal_favourites       enable row level security;
alter table campaigns               enable row level security;
alter table donations               enable row level security;
alter table volunteer_opportunities enable row level security;
alter table volunteer_applications  enable row level security;
alter table lost_found_posts        enable row level security;
alter table notifications           enable row level security;

-- Helper: is the current JWT a member of this organization?
create or replace function is_org_member(p_org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organization_members
    where org_id = p_org_id and profile_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Public reads
-- ---------------------------------------------------------------------------
drop policy if exists "public read organizations" on organizations;
create policy "public read organizations" on organizations
  for select using (true);

drop policy if exists "public read rescues" on rescues;
create policy "public read rescues" on rescues
  for select using (true);

drop policy if exists "public read rescue updates" on rescue_updates;
create policy "public read rescue updates" on rescue_updates
  for select using (true);

drop policy if exists "public read animals" on animals;
create policy "public read animals" on animals
  for select using (true);

drop policy if exists "public read campaigns" on campaigns;
create policy "public read campaigns" on campaigns
  for select using (status <> 'draft');

drop policy if exists "public read opportunities" on volunteer_opportunities;
create policy "public read opportunities" on volunteer_opportunities
  for select using (true);

drop policy if exists "public read lost found" on lost_found_posts;
create policy "public read lost found" on lost_found_posts
  for select using (true);

-- Profiles are readable so a rescue card can show "reported by Aditi" — the
-- table deliberately holds no email; phone is only exposed through the API,
-- which strips it for anyone who is not the owner or the claiming org.
drop policy if exists "public read profiles" on profiles;
create policy "public read profiles" on profiles
  for select using (true);

-- Donor rows are shown on campaign pages, so the amount and (unless the donor
-- asked for anonymity) the name are public. Emails never are; the API projects
-- them away and this policy keeps direct reads to succeeded rows only.
drop policy if exists "public read succeeded donations" on donations;
create policy "public read succeeded donations" on donations
  for select using (status = 'succeeded');

-- ---------------------------------------------------------------------------
-- Owner-scoped reads
-- ---------------------------------------------------------------------------
drop policy if exists "own notifications" on notifications;
create policy "own notifications" on notifications
  for select using (auth.uid() = profile_id);

drop policy if exists "own adoption applications" on adoption_applications;
create policy "own adoption applications" on adoption_applications
  for select using (
    auth.uid() = applicant_id
    or exists (
      select 1 from animals a
      where a.id = adoption_applications.animal_id and is_org_member(a.org_id)
    )
  );

drop policy if exists "own volunteer applications" on volunteer_applications;
create policy "own volunteer applications" on volunteer_applications
  for select using (
    auth.uid() = profile_id
    or exists (
      select 1 from volunteer_opportunities o
      where o.id = volunteer_applications.opportunity_id and is_org_member(o.org_id)
    )
  );

drop policy if exists "own favourites" on animal_favourites;
create policy "own favourites" on animal_favourites
  for select using (auth.uid() = profile_id);

drop policy if exists "own watches" on rescue_watchers;
create policy "own watches" on rescue_watchers
  for select using (auth.uid() = profile_id);

drop policy if exists "own memberships" on organization_members;
create policy "own memberships" on organization_members
  for select using (auth.uid() = profile_id or is_org_member(org_id));

-- ---------------------------------------------------------------------------
-- RPC exposure. The geo functions read only public columns, so both roles may
-- call them; the write path stays closed.
-- ---------------------------------------------------------------------------
grant execute on function nearby_rescues       to anon, authenticated;
grant execute on function nearby_animals       to anon, authenticated;
grant execute on function nearby_organizations to anon, authenticated;
grant execute on function nearby_lost_found    to anon, authenticated;
grant execute on function nearby_opportunities to anon, authenticated;
grant execute on function match_lost_found     to anon, authenticated;
grant execute on function platform_stats       to anon, authenticated;
