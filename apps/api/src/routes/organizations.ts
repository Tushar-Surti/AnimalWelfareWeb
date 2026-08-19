import { Hono } from 'hono';
import { createOrganizationSchema, updateOrganizationSchema, geoQuery, slugify, uuid } from '@aww/shared';
import { z } from 'zod';
import { db, unwrap } from '../lib/supabase.js';
import { ok, created, paginate, paginateWithCount } from '../lib/respond.js';
import { snakify, definedOnly } from '../lib/case.js';
import { ApiError } from '../lib/errors.js';
import { optionalAuth, requireAuth, currentUser } from '../middleware/auth.js';
import { assertOrgMember } from '../lib/guards.js';

const orgs = new Hono();

/** Slugs are public URLs, so they must be unique and stable. Append a counter
 *  rather than a random suffix — "happy-tails-2" reads better than "happy-tails-x7f". */
async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || 'organization';
  for (let n = 0; n < 50; n += 1) {
    const candidate = n === 0 ? base : `${base}-${n + 1}`;
    const { data } = await db.from('organizations').select('id').eq('slug', candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

orgs.get('/', optionalAuth, async (c) => {
  const q = geoQuery.partial({ lat: true, lng: true }).extend({
    q: z.string().trim().max(80).optional(),
    verified: z.coerce.boolean().optional(),
    acceptsRescues: z.coerce.boolean().optional(),
    city: z.string().trim().max(80).optional(),
  }).parse(c.req.query());

  if (q.lat !== undefined && q.lng !== undefined) {
    const rows = unwrap(
      await db.rpc('nearby_organizations', {
        p_lat: q.lat,
        p_lng: q.lng,
        p_radius_km: q.radiusKm,
        p_accepts_rescues: q.acceptsRescues ?? null,
        p_limit: q.limit,
        p_offset: q.offset,
      }),
    ) as Array<Record<string, unknown>>;
    return ok(c, paginate(rows, q.limit, q.offset));
  }

  let query = db.from('organizations').select('*', { count: 'exact' });
  if (q.q) query = query.ilike('name', `%${q.q}%`);
  if (q.city) query = query.ilike('city', q.city);
  if (q.verified !== undefined) query = query.eq('verified', q.verified);
  if (q.acceptsRescues !== undefined) query = query.eq('accepts_rescues', q.acceptsRescues);

  const { data, count } = await query
    .order('verified', { ascending: false })
    .order('created_at', { ascending: false })
    .range(q.offset, q.offset + q.limit - 1);

  return ok(c, paginateWithCount(data ?? [], count ?? 0, q.limit, q.offset));
});

/** Accepts either a uuid or a slug, so /orgs/happy-tails works in the browser. */
orgs.get('/:handle', async (c) => {
  const handle = c.req.param('handle');
  const column = uuid.safeParse(handle).success ? 'id' : 'slug';

  const { data: org } = await db.from('organizations').select('*').eq(column, handle).maybeSingle();
  if (!org) throw ApiError.notFound('We could not find that organization.');

  const [{ count: animals }, { count: rescuesHandled }, { data: campaigns }] = await Promise.all([
    db.from('animals').select('*', { count: 'exact', head: true }).eq('org_id', org.id).eq('status', 'available'),
    db.from('rescues').select('*', { count: 'exact', head: true }).eq('claimed_by', org.id),
    db.from('campaigns').select('*').eq('org_id', org.id).eq('status', 'active').limit(3),
  ]);

  return ok(c, {
    ...org,
    stats: { animals_available: animals ?? 0, rescues_handled: rescuesHandled ?? 0 },
    campaigns: campaigns ?? [],
  });
});

orgs.post('/', requireAuth, async (c) => {
  const input = createOrganizationSchema.parse(await c.req.json());
  const user = currentUser(c);

  // One organization per account keeps ownership unambiguous; staff join an
  // existing org through organization_members instead.
  const { data: existing } = await db.from('organizations').select('id').eq('owner_id', user.id).maybeSingle();
  if (existing) throw ApiError.conflict('You already run an organization on A.W.W. Helpers.');

  const row = unwrap(
    await db
      .from('organizations')
      .insert({ ...snakify(input), owner_id: user.id, slug: await uniqueSlug(input.name) })
      .select('*')
      .single(),
  );

  // Running an organization makes you an NGO account.
  if (user.profile.role === 'citizen') {
    await db.from('profiles').update({ role: 'ngo' }).eq('id', user.id);
  }

  return created(c, row);
});

orgs.patch('/:id', requireAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  const input = updateOrganizationSchema.parse(await c.req.json());
  assertOrgMember(currentUser(c), id, ['owner', 'admin']);

  const row = unwrap(
    await db.from('organizations').update(definedOnly(snakify(input))).eq('id', id).select('*').single(),
  );
  return ok(c, row);
});

orgs.get('/:id/members', requireAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  assertOrgMember(currentUser(c), id);

  const { data } = await db
    .from('organization_members')
    .select('role, created_at, profile:profiles (id, full_name, avatar_url, phone)')
    .eq('org_id', id);

  return ok(c, data ?? []);
});

/** Dashboard payload: everything an org's home screen needs in one round trip. */
orgs.get('/:id/dashboard', requireAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  assertOrgMember(currentUser(c), id);

  const [open, animals, applications, campaigns, opportunities] = await Promise.all([
    db.from('rescues').select('*').eq('claimed_by', id).in('status', ['claimed', 'in_care']).order('created_at', { ascending: false }),
    db.from('animals').select('*').eq('org_id', id).order('created_at', { ascending: false }).limit(50),
    db
      .from('adoption_applications')
      .select('*, animal:animals!inner (id, name, slug, photos, org_id), applicant:profiles (id, full_name, avatar_url)')
      .eq('animal.org_id', id)
      .in('status', ['submitted', 'reviewing'])
      .order('created_at', { ascending: false }),
    db.from('campaigns').select('*').eq('org_id', id).order('created_at', { ascending: false }),
    db.from('volunteer_opportunities').select('*').eq('org_id', id).order('created_at', { ascending: false }),
  ]);

  return ok(c, {
    active_rescues: open.data ?? [],
    animals: animals.data ?? [],
    pending_applications: applications.data ?? [],
    campaigns: campaigns.data ?? [],
    opportunities: opportunities.data ?? [],
  });
});

export default orgs;
