import type { MiddlewareHandler } from 'hono';
import { db, verifyToken } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { camelize } from '../lib/case.js';
import type { Profile } from '@aww/shared';

export type AuthUser = {
  id: string;
  email: string;
  profile: Profile;
  /** Organization ids this user can act on behalf of, with their role. */
  orgs: Array<{ id: string; role: string }>;
};

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser | null;
  }
}

async function loadUser(token: string): Promise<AuthUser | null> {
  const authUser = await verifyToken(token);
  if (!authUser) return null;

  const { data: profile } = await db.from('profiles').select('*').eq('id', authUser.id).single();
  if (!profile) return null;

  const { data: memberships } = await db
    .from('organization_members')
    .select('org_id, role')
    .eq('profile_id', authUser.id);

  return {
    id: authUser.id,
    email: authUser.email ?? '',
    profile: camelize<Profile>(profile),
    orgs: (memberships ?? []).map((m) => ({ id: m.org_id as string, role: m.role as string })),
  };
}

function bearer(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

/**
 * Populates `c.get('user')` when a valid token is present and moves on quietly
 * when it is not. Used by public routes that show extra detail to signed-in
 * viewers — a rescue's contact number, whether you already favourited an animal.
 */
export const optionalAuth: MiddlewareHandler = async (c, next) => {
  const token = bearer(c.req.header('Authorization'));
  c.set('user', token ? await loadUser(token) : null);
  await next();
};

/** Rejects anonymous callers before the handler runs. */
export const requireAuth: MiddlewareHandler = async (c, next) => {
  const token = bearer(c.req.header('Authorization'));
  if (!token) throw ApiError.unauthorized();

  const user = await loadUser(token);
  if (!user) throw ApiError.unauthorized('Your session has expired. Please sign in again.');

  c.set('user', user);
  await next();
};

/** Convenience for handlers behind requireAuth, where null is impossible. */
export function currentUser(c: { get: (k: 'user') => AuthUser | null }): AuthUser {
  const user = c.get('user');
  if (!user) throw ApiError.unauthorized();
  return user;
}
