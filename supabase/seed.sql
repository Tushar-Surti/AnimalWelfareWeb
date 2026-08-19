-- ============================================================================
-- A.W.W. Helpers — demo seed
--
-- Populates three Mumbai/Pune organizations with rescues, adoptable animals,
-- a fundraiser, volunteer slots and a lost/found pair, so a fresh deploy has
-- something on the map instead of an empty radius.
--
--   npm run db:push -- --seed
--
-- Safe to re-run: everything keys off fixed UUIDs and upserts.
-- Organizations are attached to the first real profile in the database, so
-- sign up once before running this.
-- ============================================================================

do $$
declare
  owner uuid;
  org_happy uuid := '11111111-1111-4111-8111-111111111111';
  org_paws  uuid := '22222222-2222-4222-8222-222222222222';
  org_pune  uuid := '33333333-3333-4333-8333-333333333333';
begin
  select id into owner from public.profiles order by created_at limit 1;

  if owner is null then
    raise notice 'No profiles yet — sign up in the app once, then re-run the seed.';
    return;
  end if;

  -- ── Organizations ───────────────────────────────────────────────────────
  insert into public.organizations
    (id, owner_id, name, slug, tagline, description, email, phone, website,
     address_line1, city, state, pincode, lat, lng, services, accepts_rescues, verified, verified_at)
  values
    (org_happy, owner, 'Happy Tails Foundation', 'happy-tails-foundation',
     'Street rescue and rehoming across western Mumbai',
     'We run a 24/7 street rescue line, a 40-bed shelter in Andheri, and a weekly sterilisation camp. Every animal that comes through us is vaccinated, sterilised and health-checked before it goes anywhere.',
     'hello@happytails.org', '9820011223', 'https://happytails.example.org',
     'Plot 14, MIDC Road', 'Mumbai', 'Maharashtra', '400053', 19.1136, 72.8697,
     array['Street rescue','Veterinary care','Sterilisation','Adoption'], true, true, now()),

    (org_paws, owner, 'Paws & Purrs Bandra', 'paws-and-purrs-bandra',
     'A small cat-first shelter with a big waiting list',
     'Twelve foster homes, one clinic partnership, and a stubborn belief that indie cats deserve the same shot as pedigrees. We focus on kittens pulled off Bandra and Khar streets.',
     'contact@pawsandpurrs.org', '9820044556', null,
     '3rd Floor, Hill Road', 'Mumbai', 'Maharashtra', '400050', 19.0544, 72.8402,
     array['Fostering','Adoption','Veterinary care'], true, true, now()),

    (org_pune, owner, 'Koregaon Animal Trust', 'koregaon-animal-trust',
     'Rescue, rehab and release across east Pune',
     'We handle everything from road-accident cases to cattle in distress, with an ambulance that covers Kalyani Nagar to Kharadi. Adoption is a small part of what we do — most of our animals go back to their streets, healthier.',
     'help@koregaontrust.org', '9822033445', null,
     'Lane 5, Koregaon Park', 'Pune', 'Maharashtra', '411001', 18.5362, 73.8939,
     array['Street rescue','Ambulance','Cattle care','Sterilisation'], true, false, null)
  on conflict (id) do update set
    name = excluded.name, tagline = excluded.tagline, description = excluded.description,
    lat = excluded.lat, lng = excluded.lng, verified = excluded.verified;

  -- ── Rescues ─────────────────────────────────────────────────────────────
  insert into public.rescues
    (id, reporter_id, title, description, species, urgency, status, address, landmark,
     city, pincode, lat, lng, contact_name, contact_phone, claimed_by, claimed_at, created_at)
  values
    ('aaaa1111-1111-4111-8111-111111111111', owner,
     'Limping pup near Andheri station',
     'Small brown pup, back-right leg looks hurt — she can walk but keeps holding it up. Hiding under a parked auto by the east exit. Been there at least an hour, people are walking past.',
     'dog', 'critical', 'claimed', 'Andheri East, near the auto stand', 'Behind the vada pav cart',
     'Mumbai', '400069', 19.1197, 72.8464, 'Aditi', '9876543210', org_happy, now() - interval '2 hours',
     now() - interval '3 hours'),

    ('aaaa2222-2222-4222-8222-222222222222', null,
     'Three kittens, no mother, on Linking Road',
     'Found three very small kittens in a cardboard box outside the shoe shop. Eyes are open but they are tiny. No sign of the mother for the last few hours and it looks like rain.',
     'cat', 'urgent', 'in_care', 'Linking Road, Bandra West', 'Outside the corner shoe shop',
     'Mumbai', '400050', 19.0607, 72.8302, 'Rehan', '9876500011', org_paws, now() - interval '1 day',
     now() - interval '1 day 2 hours'),

    ('aaaa3333-3333-4333-8333-333333333333', null,
     'Injured crow near the flyover',
     'A crow on the pavement, one wing clearly not right — it hops but cannot fly. Traffic is close. I have put a box over it loosely so it does not wander into the road.',
     'bird', 'urgent', 'reported', 'Kalyani Nagar', 'Under the flyover, north side',
     'Pune', '411006', 18.5479, 73.9033, 'Sneha', '9822011234', null, null, now() - interval '4 hours'),

    ('aaaa4444-4444-4444-8444-444444444444', owner,
     'Street dog with a skin condition',
     'The tan dog who lives near our gate has lost a lot of fur on his back and keeps scratching. He is friendly and lets people near. Not an emergency but it is getting worse each week.',
     'dog', 'stable', 'resolved', 'Khar West', 'Near the housing society gate',
     'Mumbai', '400052', 19.0728, 72.8347, 'Aditi', '9876543210', org_happy,
     now() - interval '9 days', now() - interval '10 days')
  on conflict (id) do nothing;

  update public.rescues set resolved_at = now() - interval '2 days'
   where id = 'aaaa4444-4444-4444-8444-444444444444' and resolved_at is null;

  -- ── Adoptable animals ───────────────────────────────────────────────────
  insert into public.animals
    (id, org_id, name, slug, species, breed, sex, age_months, size, colour, story,
     personality, vaccinated, sterilised, dewormed, good_with, adoption_fee,
     city, pincode, lat, lng)
  values
    ('bbbb1111-1111-4111-8111-111111111111', org_happy, 'Momo', 'momo', 'dog', 'Indie', 'female', 8, 'medium', 'Tan with a white chest',
     'Momo came to us off a service road with a fractured hip and a deep suspicion of people. Four months later she leans her whole weight against anyone who sits down near her. She is house-trained, walks well on a leash, and has decided that the sound of a fridge opening is a personal invitation.',
     array['gentle','food-motivated','velcro'], true, true, true, array['kids','dogs','apartments'], 0,
     'Mumbai', '400053', 19.1136, 72.8697),

    ('bbbb2222-2222-4222-8222-222222222222', org_paws, 'Biryani', 'biryani', 'cat', 'Indie', 'male', 5, 'small', 'Orange tabby',
     'Named for what he was found next to. Biryani is a chaos agent in a very small body — he will climb your curtains, sit on your laptop, and then fall asleep on your neck as though none of it happened. Best suited to a home that thinks this is funny rather than a problem.',
     array['playful','loud','fearless'], true, false, true, array['kids','cats'], 0,
     'Mumbai', '400050', 19.0544, 72.8402),

    ('bbbb3333-3333-4333-8333-333333333333', org_paws, 'Poha', 'poha', 'cat', 'Indie', 'female', 24, 'small', 'Grey and white',
     'Poha is the quiet one. She spent two years as a street cat near a tea stall and still prefers to watch a room before joining it. Give her a high shelf and a week of patience and she will start sleeping on your feet. She would do best somewhere calm, ideally as the only cat.',
     array['calm','independent','watchful'], true, true, true, array['seniors','apartments'], 0,
     'Mumbai', '400050', 19.0544, 72.8402),

    ('bbbb4444-4444-4444-8444-444444444444', org_pune, 'Ladoo', 'ladoo', 'dog', 'Indie mix', 'male', 3, 'medium', 'Black with tan points',
     'Ladoo and his two siblings were found in a drainage pipe during the first rains. The other two have homes now. He is a completely ordinary, completely wonderful puppy — chews everything, sleeps hard, has no idea how big his paws are going to get.',
     array['bouncy','curious','sleepy'], true, false, true, array['kids','dogs'], 0,
     'Pune', '411001', 18.5362, 73.8939)
  on conflict (id) do nothing;

  -- ── Fundraiser ──────────────────────────────────────────────────────────
  insert into public.campaigns
    (id, org_id, title, slug, summary, story, goal_amount, currency, deadline, status)
  values
    ('cccc1111-1111-4111-8111-111111111111', org_happy,
     'Get Momo''s hip surgery done', 'momo-hip-surgery',
     'Momo needs a femoral head ostectomy on her fractured hip. The quote is ₹45,000 including six weeks of physio.',
     E'When Momo came in, the fracture was already three weeks old and had started to fuse wrong. Our vet has been managing her pain since, but she is eight months old — she has a long life ahead of her and she should not spend it limping.\n\nThe surgery is routine, the recovery is not: six weeks of restricted movement, twice-weekly physio, and a foster home patient enough to enforce both. We have the foster home. We need the surgery.\n\nThe quote covers the procedure, three nights of post-op care, medication, and the full physio course. Anything raised beyond it goes to the next dog on our list, and we will tell you who that is.',
     45000, 'INR', current_date + 45, 'active')
  on conflict (id) do nothing;

  -- ── Volunteer opportunities ─────────────────────────────────────────────
  insert into public.volunteer_opportunities
    (id, org_id, title, description, skills, commitment, slots, remote, address, city, pincode, lat, lng)
  values
    ('dddd1111-1111-4111-8111-111111111111', org_happy,
     'Sunday transport driver',
     'We move animals between our Andheri shelter and partner clinics every Sunday morning. You need a car, about three hours, and no strong feelings about dog hair on your seats. We provide crates, and someone always rides along with you.',
     array['Own vehicle','Comfortable with dogs'], 'Sunday mornings, 8am–11am', 4, false,
     'MIDC Road, Andheri East', 'Mumbai', '400053', 19.1136, 72.8697),

    ('dddd2222-2222-4222-8222-222222222222', org_paws,
     'Photograph adoptable cats',
     'A good photo is the single biggest factor in how fast a cat gets adopted, and ours are currently being shot on a cracked phone. Come to a foster home for two hours a month and make our cats look like they deserve.',
     array['Photography','Own camera'], 'Two hours a month', 2, false,
     'Hill Road, Bandra West', 'Mumbai', '400050', 19.0544, 72.8402),

    ('dddd3333-3333-4333-8333-333333333333', org_pune,
     'Help us keep our records straight',
     'Remote and unglamorous: we have three years of rescue records across two spreadsheets and a WhatsApp group. If organising data is the thing that makes your brain happy, we would like to talk to you.',
     array['Spreadsheets','Attention to detail'], 'A few hours a week, whenever suits', 1, true,
     null, 'Pune', null, null, null)
  on conflict (id) do nothing;

  -- ── Lost & found pair (deliberately matchable) ──────────────────────────
  insert into public.lost_found_posts
    (id, author_id, kind, pet_name, species, breed, colour, sex, description, distinguishing,
     seen_at, address, city, pincode, lat, lng, contact_name, contact_phone, reward, status)
  values
    ('eeee1111-1111-4111-8111-111111111111', owner, 'lost', 'Chikoo', 'dog', 'Indie', 'Light brown', 'male',
     'Chikoo slipped his collar during the Diwali crackers and bolted. He is very friendly but terrified of loud noises, so he is probably hiding somewhere quiet rather than wandering. Answers to his name and to the sound of a biscuit packet.',
     'White sock on the front left paw, small notch in the right ear',
     now() - interval '3 days', 'Koregaon Park, Lane 7', 'Pune', '411001', 18.5362, 73.8939,
     'Sneha', '9822011234', 5000, 'open'),

    ('eeee2222-2222-4222-8222-222222222222', null, 'found', null, 'dog', 'Indie', 'Light brown', 'male',
     'Friendly brown dog turned up in our building compound two days ago and will not leave. Clearly someone''s pet — he sits on command and is very well fed. No collar. We are feeding him but cannot keep him.',
     'Has a white front paw and a nick out of one ear',
     now() - interval '2 days', 'Kalyani Nagar', 'Pune', '411006', 18.5479, 73.9033,
     'Vikram', '9822099887', null, 'open')
  on conflict (id) do nothing;

  raise notice 'Seeded 3 organizations, 4 rescues, 4 animals, 1 campaign, 3 opportunities, 2 board posts.';
end $$;
