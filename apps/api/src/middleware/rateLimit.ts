import type { MiddlewareHandler } from 'hono';
import { ApiError } from '../lib/errors.js';

/**
 * Fixed-window limiter, in memory. Render runs this API as a single instance,
 * so a shared store would be overkill; if it ever scales horizontally this is
 * the one piece that needs to move to Redis.
 */
type Window = { count: number; resetAt: number };
const windows = new Map<string, Window>();

// Bounded cleanup so a burst of unique IPs cannot grow the map forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, w] of windows) if (w.resetAt <= now) windows.delete(key);
}, 60_000).unref();

export function rateLimit(options: { limit: number; windowMs: number; key?: string }): MiddlewareHandler {
  const { limit, windowMs, key: scope = 'default' } = options;

  return async (c, next) => {
    const user = c.get('user');
    const identity =
      user?.id ??
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      c.req.header('x-real-ip') ??
      'anonymous';

    const key = `${scope}:${identity}`;
    const now = Date.now();
    const existing = windows.get(key);

    if (!existing || existing.resetAt <= now) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      existing.count += 1;
      if (existing.count > limit) {
        const seconds = Math.ceil((existing.resetAt - now) / 1000);
        c.header('Retry-After', String(seconds));
        throw ApiError.tooMany(`Too many requests. Try again in ${seconds}s.`);
      }
    }

    const remaining = Math.max(0, limit - (windows.get(key)?.count ?? 0));
    c.header('X-RateLimit-Limit', String(limit));
    c.header('X-RateLimit-Remaining', String(remaining));
    await next();
  };
}
