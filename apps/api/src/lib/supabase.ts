import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';
import { ApiError } from './errors.js';

/**
 * Service-role client. Bypasses row level security entirely, so every route
 * that uses it is responsible for its own authorization checks — see
 * middleware/auth.ts and the assertOrgMember helper in lib/guards.ts.
 */
export const db: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { headers: { 'x-application-name': 'aww-api' } },
});

/** Verifies a browser-issued JWT. Uses the anon client so a forged token can
 *  never be validated against service-role privileges. */
const authClient: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function verifyToken(token: string) {
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

/**
 * supabase-js returns `{ data, error }`; this turns the error half into a throw
 * so route handlers can read like straight-line code.
 *
 * A null `data` with no error means the row vanished between the check and the
 * write (a concurrent delete, or an `.eq()` guard that stopped an update from
 * matching). That is a genuine failure at every call site here, so it throws
 * rather than handing back a null the caller would have to re-check.
 */
export function unwrap<T>(result: {
  data: T;
  error: { message: string; code?: string } | null;
}): NonNullable<T> {
  if (result.error) {
    const err = new Error(result.error.message);
    (err as Error & { pgCode?: string }).pgCode = result.error.code;
    throw err;
  }
  if (result.data === null || result.data === undefined) {
    throw new ApiError(409, 'conflict', 'That record changed while we were saving. Please try again.');
  }
  return result.data as NonNullable<T>;
}
