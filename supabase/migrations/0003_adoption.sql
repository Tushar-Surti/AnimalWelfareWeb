-- ============================================================================
-- A.W.W. Helpers — 0003 · adoption & fostering
-- ============================================================================

create table if not exists animals (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organizations(id) on delete cascade,
  -- Set when an animal graduates from a rescue report into the adoption list,
  -- which is what lets a profile page show the full story end to end.
  rescue_id      uuid references rescues(id) on delete set null,
  name           text not null,
  slug           text not null,
  species        species not null default 'dog',
  breed          text,
  sex            sex not null default 'unknown',
  age_months     integer check (age_months is null or age_months >= 0),
  size           size_class,
  colour         text,
  story          text not null,
  personality    text[] not null default '{}',
  photos         text[] not null default '{}',
  vaccinated     boolean not null default false,
  sterilised     boolean not null default false,
  dewormed       boolean not null default false,
  special_needs  text,
  good_with      text[] not null default '{}',
  adoption_fee   numeric(10, 2) not null default 0,
  foster_only    boolean not null default false,
  status         animal_status not null default 'available',
  city           text,
  pincode        text,
  lat            double precision,
  lng            double precision,
  location       geography(Point, 4326),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (org_id, slug)
);

create trigger animals_updated_at before update on animals
  for each row execute function set_updated_at();
create trigger animals_location before insert or update on animals
  for each row execute function sync_location();

create index if not exists animals_location_idx on animals using gist (location);
create index if not exists animals_status_idx on animals (status);
create index if not exists animals_species_idx on animals (species);
create index if not exists animals_org_idx on animals (org_id);
create index if not exists animals_created_idx on animals (created_at desc);
create index if not exists animals_name_trgm_idx on animals using gin (name gin_trgm_ops);

create table if not exists adoption_applications (
  id             uuid primary key default gen_random_uuid(),
  animal_id      uuid not null references animals(id) on delete cascade,
  applicant_id   uuid not null references profiles(id) on delete cascade,
  full_name      text not null,
  phone          text not null,
  email          text not null,
  home_type      text,
  household      text,
  has_other_pets boolean not null default false,
  other_pets     text,
  experience     text,
  message        text,
  status         application_status not null default 'submitted',
  org_note       text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- One live application per person per animal.
  unique (animal_id, applicant_id)
);

create trigger adoption_applications_updated_at before update on adoption_applications
  for each row execute function set_updated_at();

create index if not exists adoption_applications_animal_idx on adoption_applications (animal_id);
create index if not exists adoption_applications_applicant_idx on adoption_applications (applicant_id);
create index if not exists adoption_applications_status_idx on adoption_applications (status);

-- Approving an application takes the animal off the board and politely closes
-- the others, so two families are never promised the same dog.
create or replace function adoption_on_approve()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    update public.animals set status = 'adopted' where id = new.animal_id;
    update public.adoption_applications
      set status = 'rejected',
          org_note = coalesce(org_note, 'This friend found a home with another family.')
      where animal_id = new.animal_id
        and id <> new.id
        and status in ('submitted', 'reviewing');
  end if;
  return new;
end $$;

drop trigger if exists adoption_applications_approve on adoption_applications;
create trigger adoption_applications_approve
  after update of status on adoption_applications
  for each row execute function adoption_on_approve();

create table if not exists animal_favourites (
  animal_id  uuid not null references animals(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (animal_id, profile_id)
);

create index if not exists animal_favourites_profile_idx on animal_favourites (profile_id);
