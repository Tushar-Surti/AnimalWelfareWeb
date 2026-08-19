import { Hono } from 'hono';
import { lostFoundSchema, lostFoundQuerySchema, uuid } from '@aww/shared';
import { z } from 'zod';
import { db, unwrap } from '../lib/supabase.js';
import { ok, created, paginate, paginateWithCount } from '../lib/respond.js';
import { snakify } from '../lib/case.js';
import { ApiError } from '../lib/errors.js';
import { optionalAuth, requireAuth, currentUser } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const board = new Hono();

board.get('/', optionalAuth, async (c) => {
  const q = lostFoundQuerySchema.parse(c.req.query());

  if (q.lat !== undefined && q.lng !== undefined) {
    const rows = unwrap(
      await db.rpc('nearby_lost_found', {
        p_lat: q.lat,
        p_lng: q.lng,
        p_radius_km: q.radiusKm,
        p_kind: q.kind ?? null,
        p_species: q.species ?? null,
        p_limit: q.limit,
        p_offset: q.offset,
      }),
    ) as Array<Record<string, unknown>>;
    return ok(c, paginate(rows, q.limit, q.offset));
  }

  let query = db.from('lost_found_posts').select('*', { count: 'exact' }).eq('status', q.status ?? 'open');
  if (q.kind) query = query.eq('kind', q.kind);
  if (q.species) query = query.in('species', q.species);

  const { data, count } = await query
    .order('seen_at', { ascending: false })
    .range(q.offset, q.offset + q.limit - 1);

  return ok(c, paginateWithCount(data ?? [], count ?? 0, q.limit, q.offset));
});

board.get('/:id', optionalAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));

  const { data: post } = await db
    .from('lost_found_posts')
    .select('*, author:profiles (id, full_name, avatar_url)')
    .eq('id', id)
    .maybeSingle();
  if (!post) throw ApiError.notFound('That post is no longer on the board.');

  // The whole point of the board: show the other side's candidates right here.
  const matches = unwrap(await db.rpc('match_lost_found', { p_post_id: id, p_radius_km: 15 }));

  return ok(c, { ...post, matches: matches ?? [] });
});

board.post('/', optionalAuth, rateLimit({ limit: 6, windowMs: 10 * 60 * 1000, key: 'lostfound' }), async (c) => {
  const input = lostFoundSchema.parse(await c.req.json());
  const user = c.get('user');

  const row = unwrap(
    await db
      .from('lost_found_posts')
      .insert({ ...snakify(input), seen_at: input.seenAt.toISOString(), author_id: user?.id ?? null })
      .select('*')
      .single(),
  );

  return created(c, row);
});

/** Closing the loop. Marking a reunion links both posts so the board can show
 *  a "reunited" story instead of two orphaned listings. */
board.patch('/:id/status', requireAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  const { status, matchedWith } = z
    .object({ status: z.enum(['open', 'reunited', 'closed']), matchedWith: uuid.optional() })
    .parse(await c.req.json());
  const user = currentUser(c);

  const { data: post } = await db.from('lost_found_posts').select('id, author_id').eq('id', id).maybeSingle();
  if (!post) throw ApiError.notFound();
  if (post.author_id !== user.id && user.profile.role !== 'admin') throw ApiError.forbidden();

  const row = unwrap(
    await db
      .from('lost_found_posts')
      .update({ status, reunited_with: status === 'reunited' ? matchedWith ?? null : null })
      .eq('id', id)
      .select('*')
      .single(),
  );

  if (status === 'reunited' && matchedWith) {
    await db
      .from('lost_found_posts')
      .update({ status: 'reunited', reunited_with: id })
      .eq('id', matchedWith);
  }

  return ok(c, row);
});

export default board;
