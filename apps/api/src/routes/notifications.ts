import { Hono } from 'hono';
import { uuid } from '@aww/shared';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { ok } from '../lib/respond.js';
import { requireAuth, currentUser } from '../middleware/auth.js';

const notifications = new Hono();

notifications.get('/', requireAuth, async (c) => {
  const { limit, unreadOnly } = z
    .object({
      limit: z.coerce.number().int().min(1).max(50).default(20),
      unreadOnly: z.coerce.boolean().default(false),
    })
    .parse(c.req.query());
  const user = currentUser(c);

  let query = db.from('notifications').select('*').eq('profile_id', user.id);
  if (unreadOnly) query = query.is('read_at', null);

  const [{ data }, { count }] = await Promise.all([
    query.order('created_at', { ascending: false }).limit(limit),
    db.from('notifications').select('*', { count: 'exact', head: true }).eq('profile_id', user.id).is('read_at', null),
  ]);

  return ok(c, { items: data ?? [], unread: count ?? 0 });
});

notifications.post('/read', requireAuth, async (c) => {
  const { ids } = z.object({ ids: z.array(uuid).optional() }).parse(await c.req.json().catch(() => ({})));
  const user = currentUser(c);

  // No ids means "mark everything read" — what the bell's clear button does.
  let query = db.from('notifications').update({ read_at: new Date().toISOString() }).eq('profile_id', user.id).is('read_at', null);
  if (ids?.length) query = query.in('id', ids);
  await query;

  return ok(c, { read: true });
});

export default notifications;
