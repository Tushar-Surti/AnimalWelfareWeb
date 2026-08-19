-- ============================================================================
-- A.W.W. Helpers — 0007 · notifications & activity
-- ============================================================================

create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_profile_idx
  on notifications (profile_id, created_at desc);
create index if not exists notifications_unread_idx
  on notifications (profile_id) where read_at is null;

-- Everyone watching a rescue hears about every update on it.
create or replace function notify_rescue_watchers()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r record;
begin
  select reference, title into r from public.rescues where id = new.rescue_id;

  insert into public.notifications (profile_id, type, title, body, link)
  select w.profile_id,
         'rescue_update',
         r.title,
         new.message,
         '/rescues/' || new.rescue_id
  from public.rescue_watchers w
  where w.profile_id is distinct from new.author_id;

  return null;
end $$;

drop trigger if exists rescue_updates_notify on rescue_updates;
create trigger rescue_updates_notify
  after insert on rescue_updates
  for each row execute function notify_rescue_watchers();

-- Applicants hear back the moment an organization moves their application.
create or replace function notify_application_decision()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  animal_name text;
begin
  if new.status is distinct from old.status then
    select name into animal_name from public.animals where id = new.animal_id;

    insert into public.notifications (profile_id, type, title, body, link)
    values (
      new.applicant_id,
      'adoption_' || new.status,
      case new.status
        when 'approved'  then 'You have been matched with ' || coalesce(animal_name, 'a friend') || '!'
        when 'reviewing' then 'Your application is being reviewed'
        when 'rejected'  then 'An update on your application'
        else 'Application updated'
      end,
      coalesce(new.org_note, 'Open your dashboard for the details.'),
      '/dashboard/applications'
    );
  end if;
  return null;
end $$;

drop trigger if exists adoption_applications_notify on adoption_applications;
create trigger adoption_applications_notify
  after update of status on adoption_applications
  for each row execute function notify_application_decision();
