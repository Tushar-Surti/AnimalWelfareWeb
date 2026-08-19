import { Hono } from 'hono';
import {
  createAnimalSchema, updateAnimalSchema, animalQuerySchema,
  adoptionApplicationSchema, applicationDecisionSchema, slugify, uuid,
} from '@aww/shared';
import { db, unwrap } from '../lib/supabase.js';
import { ok, created, paginate, paginateWithCount } from '../lib/respond.js';
import { snakify, definedOnly } from '../lib/case.js';
import { ApiError } from '../lib/errors.js';
import { optionalAuth, requireAuth, currentUser } from '../middleware/auth.js';
import { assertOrgMember, assertOwnsVia } from '../lib/guards.js';

const animals = new Hono();

const ORG_SELECT = 'organization:organizations (id, name, slug, logo_url, verified, city)';

animals.get('/', optionalAuth, async (c) => {
  const q = animalQuerySchema.parse(c.req.query());
  const user = c.get('user');

  let payload;
  if (q.lat !== undefined && q.lng !== undefined) {
    const rows = unwrap(
      await db.rpc('nearby_animals', {
        p_lat: q.lat,
        p_lng: q.lng,
        p_radius_km: q.radiusKm,
        p_species: q.species ?? null,
        p_sex: q.sex ?? null,
        p_size: q.size ?? null,
        p_max_age_months: q.maxAgeMonths ?? null,
        p_limit: q.limit,
        p_offset: q.offset,
      }),
    ) as Array<Record<string, unknown>>;
    payload = paginate(rows, q.limit, q.offset);
  } else {
    let query = db.from('animals').select(`*, ${ORG_SELECT}`, { count: 'exact' }).eq('status', 'available');
    if (q.species) query = query.in('species', q.species);
    if (q.sex) query = query.in('sex', q.sex);
    if (q.size) query = query.in('size', q.size);
    if (q.orgId) query = query.eq('org_id', q.orgId);
    if (q.maxAgeMonths !== undefined) query = query.lte('age_months', q.maxAgeMonths);
    if (q.q) query = query.or(`name.ilike.%${q.q}%,breed.ilike.%${q.q}%`);

    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range(q.offset, q.offset + q.limit - 1);
    payload = paginateWithCount(data ?? [], count ?? 0, q.limit, q.offset);
  }

  // Mark the ones this viewer already hearted, so the UI can render filled
  // hearts on first paint instead of flickering after a second request.
  if (user && payload.items.length > 0) {
    const ids = payload.items.map((a) => (a as { id: string }).id);
    const { data: favs } = await db
      .from('animal_favourites')
      .select('animal_id')
      .eq('profile_id', user.id)
      .in('animal_id', ids);
    const favourited = new Set((favs ?? []).map((f) => f.animal_id));
    payload.items = payload.items.map((a) => ({
      ...a,
      favourited: favourited.has((a as { id: string }).id),
    })) as typeof payload.items;
  }

  return ok(c, payload);
});

animals.get('/:id', optionalAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  const user = c.get('user');

  const { data: animal } = await db.from('animals').select(`*, ${ORG_SELECT}`).eq('id', id).maybeSingle();
  if (!animal) throw ApiError.notFound('This friend is not on the board.');

  const [favourited, application, siblings] = await Promise.all([
    user
      ? db.from('animal_favourites').select('animal_id').eq('animal_id', id).eq('profile_id', user.id)
          .maybeSingle().then((r) => Boolean(r.data))
      : Promise.resolve(false),
    user
      ? db.from('adoption_applications').select('status').eq('animal_id', id).eq('applicant_id', user.id)
          .maybeSingle().then((r) => r.data?.status ?? null)
      : Promise.resolve(null),
    db.from('animals').select(`*, ${ORG_SELECT}`).eq('org_id', animal.org_id).eq('status', 'available')
      .neq('id', id).limit(4),
  ]);

  return ok(c, { ...animal, favourited, application_status: application, siblings: siblings.data ?? [] });
});

animals.post('/', requireAuth, async (c) => {
  const body = await c.req.json();
  const orgId = uuid.parse(body.orgId);
  const input = createAnimalSchema.parse(body);
  assertOrgMember(currentUser(c), orgId);

  // Slug is unique per organization, so two shelters may both have a "Simba".
  const base = slugify(input.name) || 'friend';
  let slug = base;
  for (let n = 1; n < 50; n += 1) {
    const { data } = await db.from('animals').select('id').eq('org_id', orgId).eq('slug', slug).maybeSingle();
    if (!data) break;
    slug = `${base}-${n + 1}`;
  }

  // Fall back to the organization's own coordinates so every animal is
  // findable on the map even when the lister skips the location step.
  let { lat, lng, city, pincode } = input;
  if (lat === undefined || lng === undefined) {
    const { data: org } = await db.from('organizations').select('lat, lng, city, pincode').eq('id', orgId).single();
    lat ??= org?.lat ?? undefined;
    lng ??= org?.lng ?? undefined;
    city ??= org?.city ?? undefined;
    pincode ??= org?.pincode ?? undefined;
  }

  const row = unwrap(
    await db
      .from('animals')
      .insert({ ...snakify({ ...input, lat, lng, city, pincode }), org_id: orgId, slug })
      .select(`*, ${ORG_SELECT}`)
      .single(),
  );
  return created(c, row);
});

animals.patch('/:id', requireAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  const input = updateAnimalSchema.parse(await c.req.json());
  await assertOwnsVia(currentUser(c), 'animals', id);

  const row = unwrap(
    await db.from('animals').update(definedOnly(snakify(input))).eq('id', id).select(`*, ${ORG_SELECT}`).single(),
  );
  return ok(c, row);
});

animals.delete('/:id', requireAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  await assertOwnsVia(currentUser(c), 'animals', id);
  await db.from('animals').delete().eq('id', id);
  return ok(c, { deleted: true });
});

/* -------------------------------------------------------------------------- */
/* Favourites                                                                 */
/* -------------------------------------------------------------------------- */
animals.post('/:id/favourite', requireAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  const user = currentUser(c);
  await db.from('animal_favourites').upsert({ animal_id: id, profile_id: user.id });
  return ok(c, { favourited: true });
});

animals.delete('/:id/favourite', requireAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  const user = currentUser(c);
  await db.from('animal_favourites').delete().eq('animal_id', id).eq('profile_id', user.id);
  return ok(c, { favourited: false });
});

/* -------------------------------------------------------------------------- */
/* Adoption applications                                                      */
/* -------------------------------------------------------------------------- */
animals.post('/:id/apply', requireAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  const input = adoptionApplicationSchema.parse(await c.req.json());
  const user = currentUser(c);

  const { data: animal } = await db.from('animals').select('id, status, org_id, name').eq('id', id).maybeSingle();
  if (!animal) throw ApiError.notFound();
  if (animal.status !== 'available') {
    throw ApiError.conflict('This friend is no longer available for adoption.');
  }
  if (user.orgs.some((o) => o.id === animal.org_id)) {
    throw ApiError.badRequest('You cannot apply to adopt from your own organization.');
  }

  const { data: existing } = await db
    .from('adoption_applications')
    .select('id, status')
    .eq('animal_id', id)
    .eq('applicant_id', user.id)
    .maybeSingle();
  if (existing && existing.status !== 'withdrawn') {
    throw ApiError.conflict('You have already applied for this friend.');
  }

  // Re-applying after withdrawing reuses the row, since the unique constraint
  // is on (animal, applicant).
  const payload = { ...snakify(input), animal_id: id, applicant_id: user.id, status: 'submitted' };
  const row = unwrap(
    existing
      ? await db.from('adoption_applications').update(payload).eq('id', existing.id).select('*').single()
      : await db.from('adoption_applications').insert(payload).select('*').single(),
  );

  return created(c, row);
});

animals.get('/:id/applications', requireAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  await assertOwnsVia(currentUser(c), 'animals', id);

  const { data } = await db
    .from('adoption_applications')
    .select('*, applicant:profiles (id, full_name, avatar_url, city)')
    .eq('animal_id', id)
    .order('created_at', { ascending: false });

  return ok(c, data ?? []);
});

export default animals;
