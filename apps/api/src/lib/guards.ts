import { ApiError } from './errors.js';
import { db } from './supabase.js';
import type { AuthUser } from '../middleware/auth.js';

/**
 * The service-role client ignores RLS, so these are the real access checks.
 * Every route that mutates organization-owned data calls one of them.
 */

export function assertOrgMember(user: AuthUser, orgId: string, roles?: string[]): void {
  if (user.profile.role === 'admin') return;

  const membership = user.orgs.find((o) => o.id === orgId);
  if (!membership) {
    throw ApiError.forbidden('You are not a member of this organization.');
  }
  if (roles && !roles.includes(membership.role)) {
    throw ApiError.forbidden('Your role in this organization cannot do that.');
  }
}

/** Resolves the organization behind a record, then checks membership. */
export async function assertOwnsVia(
  user: AuthUser,
  table: 'animals' | 'campaigns' | 'volunteer_opportunities',
  id: string,
): Promise<string> {
  const { data } = await db.from(table).select('org_id').eq('id', id).maybeSingle();
  if (!data) throw ApiError.notFound();
  assertOrgMember(user, data.org_id as string);
  return data.org_id as string;
}

export function assertSelf(user: AuthUser, ownerId: string | null): void {
  if (user.profile.role === 'admin') return;
  if (!ownerId || ownerId !== user.id) throw ApiError.forbidden();
}

/** True when the viewer may see a reporter's phone number: they filed the
 *  report, they belong to the org that claimed it, or they run a verified
 *  rescue-accepting org and the case is still unclaimed. */
export async function canSeeContact(
  user: AuthUser | null,
  rescue: { reporter_id: string | null; claimed_by: string | null },
): Promise<boolean> {
  if (!user) return false;
  if (user.profile.role === 'admin') return true;
  if (rescue.reporter_id && rescue.reporter_id === user.id) return true;
  if (rescue.claimed_by && user.orgs.some((o) => o.id === rescue.claimed_by)) return true;
  if (user.orgs.length === 0) return false;

  const { data } = await db
    .from('organizations')
    .select('id')
    .in('id', user.orgs.map((o) => o.id))
    .eq('accepts_rescues', true)
    .limit(1);

  return (data?.length ?? 0) > 0;
}
