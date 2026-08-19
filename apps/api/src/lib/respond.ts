import type { Context } from 'hono';
import type { Paginated } from '@aww/shared';
import { camelize } from './case.js';

/**
 * Columns that exist for the database's benefit, not the client's. `location`
 * is the PostGIS geography point — the same information the row already carries
 * as lat/lng, but serialised as unreadable WKB hex. Stripping it here means no
 * individual route has to remember to exclude it from a `select('*')`.
 */
const INTERNAL_COLUMNS = new Set(['location', 'total_count']);

function stripInternal(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripInternal);
  if (value === null || typeof value !== 'object' || value instanceof Date) return value;

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (INTERNAL_COLUMNS.has(key)) continue;
    out[key] = stripInternal(val);
  }
  return out;
}

export function ok<T>(c: Context, data: T, status = 200) {
  return c.json({ ok: true, data: camelize<T>(stripInternal(data)) }, status as 200);
}

export function created<T>(c: Context, data: T) {
  return ok(c, data, 201);
}

/**
 * The geo RPCs return `total_count` repeated on every row (a window function),
 * which is exactly the information a paginator needs — this lifts it out and
 * strips it from the items so it does not leak into the client types.
 */
export function paginate<T extends Record<string, unknown>>(
  rows: T[],
  limit: number,
  offset: number,
): Paginated<T> {
  const total = rows.length > 0 ? Number(rows[0]?.total_count ?? rows.length) : 0;
  const items = rows.map(({ total_count: _ignored, ...rest }) => rest as unknown as T);
  return { items, total, limit, offset, hasMore: offset + items.length < total };
}

/** For plain PostgREST list queries, where the count arrives separately. */
export function paginateWithCount<T>(items: T[], total: number, limit: number, offset: number): Paginated<T> {
  return { items, total, limit, offset, hasMore: offset + items.length < total };
}
