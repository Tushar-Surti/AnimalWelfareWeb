import { Hono } from 'hono';
import { createOpportunitySchema, volunteerApplicationSchema, applicationDecisionSchema, geoQuery, uuid } from '@aww/shared';
import { z } from 'zod';
import { db, unwrap } from '../lib/supabase.js';
import { ok, created, paginate, paginateWithCount } from '../lib/respond.js';
import { snakify } from '../lib/case.js';
import { ApiError } from '../lib/errors.js';
import { optionalAuth, requireAuth, currentUser } from '../middleware/auth.js';
import { assertOrgMember, assertOwnsVia } from '../lib/guards.js';

const volunteers = new Hono();
const ORG_SELECT = 'organization:organizations (id, name, slug, logo_url, verified)';

volunteers.get('/', optionalAuth, async (c) => {
  const q = geoQuery.partial({ lat: true, lng: true }).extend({ orgId: uuid.optional() }).parse(c.req.query());
  const user = c.get('user');

  let payload;
  if (q.lat !== undefined && q.lng !== undefined) {
    const rows = unwrap(
      await db.rpc('nearby_opportunities', {
        p_lat: q.lat, p_lng: q.lng, p_radius_km: q.radiusKm, p_limit: q.limit, p_offset: q.offset,
      }),
    ) as Array<Record<string, unknown>>;
    payload = paginate(rows, q.limit, q.offset);
  } else {
    let query = db.from('volunteer_opportunities').select(`*, ${ORG_SELECT}`, { count: 'exact' }).neq('status', 'closed');
    if (q.orgId) query = query.eq('org_id', q.orgId);
    const { data, count } = await query
      .order('starts_at', { ascending: true, nullsFirst: false })
      .range(q.offset, q.offset + q.limit - 1);
    payload = paginateWithCount(data ?? [], count ?? 0, q.limit, q.offset);
  }

  if (user && payload.items.length > 0) {
    const ids = payload.items.map((o) => (o as { id: string }).id);
    const { data: applied } = await db
      .from('volunteer_applications')
      .select('opportunity_id')
      .eq('profile_id', user.id)
      .in('opportunity_id', ids);
    const set = new Set((applied ?? []).map((a) => a.opportunity_id));
    payload.items = payload.items.map((o) => ({ ...o, applied: set.has((o as { id: string }).id) })) as typeof payload.items;
  }

  return ok(c, payload);
});

volunteers.get('/:id', optionalAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  const user = c.get('user');

  const { data } = await db.from('volunteer_opportunities').select(`*, ${ORG_SELECT}`).eq('id', id).maybeSingle();
  if (!data) throw ApiError.notFound('That opportunity has closed.');

  const applied = user
    ? await db.from('volunteer_applications').select('status').eq('opportunity_id', id).eq('profile_id', user.id)
        .maybeSingle().then((r) => r.data?.status ?? null)
    : null;

  return ok(c, { ...data, application_status: applied });
});

volunteers.post('/', requireAuth, async (c) => {
  const body = await c.req.json();
  const orgId = uuid.parse(body.orgId);
  const input = createOpportunitySchema.parse(body);
  assertOrgMember(currentUser(c), orgId);

  const row = unwrap(
    await db
      .from('volunteer_opportunities')
      .insert({
        ...snakify(input),
        starts_at: input.startsAt?.toISOString() ?? null,
        ends_at: input.endsAt?.toISOString() ?? null,
        org_id: orgId,
      })
      .select(`*, ${ORG_SELECT}`)
      .single(),
  );
  return created(c, row);
});

volunteers.post('/:id/apply', requireAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  const input = volunteerApplicationSchema.parse(await c.req.json());
  const user = currentUser(c);

  const { data: opportunity } = await db
    .from('volunteer_opportunities')
    .select('id, status, slots, filled')
    .eq('id', id)
    .maybeSingle();
  if (!opportunity) throw ApiError.notFound();
  if (opportunity.status !== 'open') throw ApiError.conflict('All the spots for this one are taken.');

  const { data: existing } = await db
    .from('volunteer_applications')
    .select('id')
    .eq('opportunity_id', id)
    .eq('profile_id', user.id)
    .maybeSingle();
  if (existing) throw ApiError.conflict('You have already signed up for this.');

  const row = unwrap(
    await db
      .from('volunteer_applications')
      .insert({ ...snakify(input), opportunity_id: id, profile_id: user.id })
      .select('*')
      .single(),
  );
  return created(c, row);
});

volunteers.get('/:id/applications', requireAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  await assertOwnsVia(currentUser(c), 'volunteer_opportunities', id);

  const { data } = await db
    .from('volunteer_applications')
    .select('*, profile:profiles (id, full_name, avatar_url, city)')
    .eq('opportunity_id', id)
    .order('created_at', { ascending: false });

  return ok(c, data ?? []);
});

volunteers.patch('/applications/:applicationId', requireAuth, async (c) => {
  const applicationId = uuid.parse(c.req.param('applicationId'));
  const { status, note } = applicationDecisionSchema.parse(await c.req.json());
  const user = currentUser(c);

  const { data: application } = await db
    .from('volunteer_applications')
    .select('id, profile_id, opportunity:volunteer_opportunities (id, org_id)')
    .eq('id', applicationId)
    .maybeSingle();
  if (!application) throw ApiError.notFound();

  const opportunity = application.opportunity as unknown as { org_id: string } | null;
  if (status === 'withdrawn') {
    if (application.profile_id !== user.id) throw ApiError.forbidden();
  } else if (opportunity) {
    assertOrgMember(user, opportunity.org_id);
  }

  const row = unwrap(
    await db.from('volunteer_applications').update({ status }).eq('id', applicationId).select('*').single(),
  );

  if (note) {
    await db.from('notifications').insert({
      profile_id: application.profile_id,
      type: `volunteer_${status}`,
      title: 'An update on your volunteer application',
      body: note,
      link: '/dashboard/applications',
    });
  }

  return ok(c, row);
});

export default volunteers;
