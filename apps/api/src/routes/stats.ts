import { Hono } from 'hono';
import { db, unwrap } from '../lib/supabase.js';
import { ok } from '../lib/respond.js';

const stats = new Hono();

/** Landing-page counters. Cached briefly at the edge — these numbers move
 *  slowly and the homepage is the most-hit route on the site. */
stats.get('/', async (c) => {
  const rows = unwrap(await db.rpc('platform_stats')) as Array<Record<string, string | number>>;
  const row = rows[0] ?? {};

  c.header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');

  // count(*) arrives as a string over the wire; the UI wants to animate numbers.
  return ok(
    c,
    Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v)])),
  );
});

export default stats;
