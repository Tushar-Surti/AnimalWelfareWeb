import { Hono } from 'hono';
import {
  createRescueSchema, rescueQuerySchema, claimRescueSchema,
  rescueStatusSchema, rescueUpdateSchema, RESCUE_TRANSITIONS, uuid,
} from '@aww/shared';
import { db, unwrap } from '../lib/supabase.js';
import { ok, created, paginate, paginateWithCount } from '../lib/respond.js';
import { camelize, snakify, definedOnly } from '../lib/case.js';
import { ApiError } from '../lib/errors.js';
import { optionalAuth, requireAuth, currentUser, type AuthUser } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { assertOrgMember, canSeeContact } from '../lib/guards.js';

const rescues = new Hono();

/** Columns joined onto a rescue for detail views. */
const DETAIL_SELECT = `
  *,
  reporter:profiles!rescues_reporter_id_fkey (id, full_name, avatar_url),
  organization:organizations!rescues_claimed_by_fkey (id, name, slug, logo_url, verified, phone)
`;

/** A phone number is personal data. Anyone may read a rescue; only the reporter
 *  and people who can actually respond get the number to call. */
function redactContact<T extends { contact_phone?: string | null }>(row: T, allowed: boolean): T {
  return allowed ? row : { ...row, contact_phone: null };
}

/* -------------------------------------------------------------------------- */
/* GET /rescues — map + feed                                                  */
/* -------------------------------------------------------------------------- */
rescues.get('/', optionalAuth, async (c) => {
  const q = rescueQuerySchema.parse(c.req.query());
  const user = c.get('user');

  // One permission check for the whole page rather than one per row.
  const canCall = user
    ? await canSeeContact(user, { reporter_id: null, claimed_by: null })
    : false;

  // Proximity search when we know where the viewer is; otherwise a plain
  // reverse-chronological feed with the same filters applied.
  if (q.lat !== undefined && q.lng !== undefined) {
    const rows = unwrap(
      await db.rpc('nearby_rescues', {
        p_lat: q.lat,
        p_lng: q.lng,
        p_radius_km: q.radiusKm,
        p_statuses: q.status ?? null,
        p_species: q.species ?? null,
        p_urgency: q.urgency ?? null,
        p_limit: q.limit,
        p_offset: q.offset,
      }),
    ) as Array<Record<string, unknown>>;

    return ok(c, paginate(rows, q.limit, q.offset));
  }

  let query = db.from('rescues').select(DETAIL_SELECT, { count: 'exact' });

  if (q.status) query = query.in('status', q.status);
  if (q.species) query = query.in('species', q.species);
  if (q.urgency) query = query.in('urgency', q.urgency);
  if (q.pincode) query = query.eq('pincode', q.pincode);
  if (q.orgId) query = query.eq('claimed_by', q.orgId);
  if (q.mine) {
    if (!user) throw ApiError.unauthorized('Sign in to see your reports.');
    query = query.eq('reporter_id', user.id);
  }

  const { data, count } = await query
    .order('created_at', { ascending: false })
    .range(q.offset, q.offset + q.limit - 1);

  const items = (data ?? []).map((row) =>
    redactContact(row as { contact_phone?: string | null }, canCall || q.mine === true),
  );

  return ok(c, paginateWithCount(items, count ?? 0, q.limit, q.offset));
});

/* -------------------------------------------------------------------------- */
/* POST /rescues — report an animal in trouble                                */
/* -------------------------------------------------------------------------- */
rescues.post(
  '/',
  optionalAuth,
  // Deliberately generous: the whole point is that a panicking stranger with no
  // account can file a report. Tight enough to stop a script.
  rateLimit({ limit: 8, windowMs: 10 * 60 * 1000, key: 'rescue-create' }),
  async (c) => {
    const input = createRescueSchema.parse(await c.req.json());
    const user = c.get('user');

    const row = unwrap(
      await db
        .from('rescues')
        .insert({ ...snakify(input), reporter_id: user?.id ?? null })
        .select(DETAIL_SELECT)
        .single(),
    );

    // The reporter follows their own report so status changes reach them.
    if (user) {
      await db.from('rescue_watchers').insert({ rescue_id: row.id, profile_id: user.id });
    }

    return created(c, row);
  },
);

/* -------------------------------------------------------------------------- */
/* GET /rescues/:id — detail with full timeline                               */
/* -------------------------------------------------------------------------- */
rescues.get('/:id', optionalAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  const user = c.get('user');

  const { data: rescue } = await db.from('rescues').select(DETAIL_SELECT).eq('id', id).maybeSingle();
  if (!rescue) throw ApiError.notFound('That rescue report does not exist.');

  const [{ data: updates }, { count: watcherCount }, watching] = await Promise.all([
    db
      .from('rescue_updates')
      .select(`
        *,
        author:profiles (id, full_name, avatar_url),
        organization:organizations (id, name, slug, logo_url)
      `)
      .eq('rescue_id', id)
      .order('created_at', { ascending: true }),
    db.from('rescue_watchers').select('*', { count: 'exact', head: true }).eq('rescue_id', id),
    user
      ? db
          .from('rescue_watchers')
          .select('rescue_id')
          .eq('rescue_id', id)
          .eq('profile_id', user.id)
          .maybeSingle()
          .then((r) => Boolean(r.data))
      : Promise.resolve(false),
  ]);

  const allowed = await canSeeContact(user, rescue as { reporter_id: string | null; claimed_by: string | null });

  return ok(c, {
    ...redactContact(rescue as { contact_phone?: string | null }, allowed),
    updates: updates ?? [],
    watcher_count: watcherCount ?? 0,
    watching,
  });
});

/* -------------------------------------------------------------------------- */
/* POST /rescues/:id/claim — an organization takes the case                    */
/* -------------------------------------------------------------------------- */
rescues.post('/:id/claim', requireAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  const { orgId, note } = claimRescueSchema.parse(await c.req.json());
  const user = currentUser(c);

  assertOrgMember(user, orgId);

  const { data: rescue } = await db.from('rescues').select('id, status, claimed_by').eq('id', id).maybeSingle();
  if (!rescue) throw ApiError.notFound('That rescue report does not exist.');

  // Two organizations racing for the same animal is a real scenario, and the
  // loser needs to be told who won rather than silently overwriting them.
  if (rescue.claimed_by && rescue.claimed_by !== orgId) {
    throw ApiError.conflict('Another organization already claimed this rescue.');
  }
  if (rescue.status === 'resolved' || rescue.status === 'closed') {
    throw ApiError.conflict('This rescue is already finished.');
  }

  const updated = unwrap(
    await db
      .from('rescues')
      .update({ claimed_by: orgId, claimed_at: new Date().toISOString(), status: 'claimed' })
      .eq('id', id)
      // Optimistic guard: only claim if still unclaimed, so concurrent requests
      // cannot both succeed.
      .is('claimed_by', null)
      .select(DETAIL_SELECT)
      .single(),
  );

  if (note) {
    await db.from('rescue_updates').insert({
      rescue_id: id,
      author_id: user.id,
      org_id: orgId,
      message: note,
    });
  }

  return ok(c, updated);
});

/* -------------------------------------------------------------------------- */
/* PATCH /rescues/:id/status                                                  */
/* -------------------------------------------------------------------------- */
rescues.patch('/:id/status', requireAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  const { status, note } = rescueStatusSchema.parse(await c.req.json());
  const user = currentUser(c);

  const { data: rescue } = await db
    .from('rescues')
    .select('id, status, claimed_by, reporter_id')
    .eq('id', id)
    .maybeSingle();
  if (!rescue) throw ApiError.notFound();

  // The claiming org drives the case. The reporter may only withdraw it.
  const isOwner = rescue.claimed_by && user.orgs.some((o) => o.id === rescue.claimed_by);
  const isReporter = rescue.reporter_id === user.id;
  const isAdmin = user.profile.role === 'admin';

  if (!isOwner && !isAdmin && !(isReporter && status === 'closed')) {
    throw ApiError.forbidden('Only the organization handling this rescue can change its status.');
  }

  const allowed = RESCUE_TRANSITIONS[rescue.status as keyof typeof RESCUE_TRANSITIONS];
  if (!allowed.includes(status)) {
    throw ApiError.badRequest(
      `A rescue cannot go from "${rescue.status}" to "${status}".`,
    );
  }

  const patch: Record<string, unknown> = { status };
  if (status === 'resolved') patch.resolved_at = new Date().toISOString();
  // Releasing a claim hands the animal back to the pool.
  if (status === 'reported') {
    patch.claimed_by = null;
    patch.claimed_at = null;
  }

  const updated = unwrap(await db.from('rescues').update(patch).eq('id', id).select(DETAIL_SELECT).single());

  if (note) {
    await db.from('rescue_updates').insert({
      rescue_id: id,
      author_id: user.id,
      org_id: rescue.claimed_by,
      message: note,
    });
  }

  return ok(c, updated);
});

/* -------------------------------------------------------------------------- */
/* POST /rescues/:id/updates — add to the timeline                            */
/* -------------------------------------------------------------------------- */
rescues.post('/:id/updates', requireAuth, rateLimit({ limit: 30, windowMs: 60_000, key: 'rescue-update' }), async (c) => {
  const id = uuid.parse(c.req.param('id'));
  const input = rescueUpdateSchema.parse(await c.req.json());
  const user = currentUser(c);

  const { data: rescue } = await db.from('rescues').select('id, claimed_by, reporter_id').eq('id', id).maybeSingle();
  if (!rescue) throw ApiError.notFound();

  const orgId = user.orgs.find((o) => o.id === rescue.claimed_by)?.id ?? null;
  if (!orgId && rescue.reporter_id !== user.id && user.profile.role !== 'admin') {
    throw ApiError.forbidden('Only the reporter or the responding organization can post updates.');
  }

  const row = unwrap(
    await db
      .from('rescue_updates')
      .insert({ ...snakify(input), rescue_id: id, author_id: user.id, org_id: orgId })
      .select(`*, author:profiles (id, full_name, avatar_url), organization:organizations (id, name, slug, logo_url)`)
      .single(),
  );

  return created(c, row);
});

/* -------------------------------------------------------------------------- */
/* Watch / unwatch                                                            */
/* -------------------------------------------------------------------------- */
rescues.post('/:id/watch', requireAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  const user = currentUser(c);
  await db.from('rescue_watchers').upsert({ rescue_id: id, profile_id: user.id });
  return ok(c, { watching: true });
});

rescues.delete('/:id/watch', requireAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  const user = currentUser(c);
  await db.from('rescue_watchers').delete().eq('rescue_id', id).eq('profile_id', user.id);
  return ok(c, { watching: false });
});

export default rescues;
