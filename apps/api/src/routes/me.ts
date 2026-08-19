import { Hono } from 'hono';
import { updateProfileSchema } from '@aww/shared';
import { db, unwrap } from '../lib/supabase.js';
import { ok } from '../lib/respond.js';
import { snakify, definedOnly } from '../lib/case.js';
import { requireAuth, currentUser } from '../middleware/auth.js';

const me = new Hono();

/** Everything the app shell needs about the signed-in person, in one call. */
me.get('/', requireAuth, async (c) => {
  const user = currentUser(c);

  const { data: memberships } = await db
    .from('organization_members')
    .select('role, organization:organizations (id, name, slug, logo_url, verified)')
    .eq('profile_id', user.id);

  return ok(c, {
    id: user.id,
    email: user.email,
    profile: user.profile,
    organizations: (memberships ?? []).map((m) => ({
      ...(m.organization as unknown as Record<string, unknown>),
      role: m.role,
    })),
  });
});

me.patch('/', requireAuth, async (c) => {
  const input = updateProfileSchema.parse(await c.req.json());
  const user = currentUser(c);

  const row = unwrap(
    await db.from('profiles').update(definedOnly(snakify(input))).eq('id', user.id).select('*').single(),
  );
  return ok(c, row);
});

/** The citizen dashboard: my reports, my hearts, my applications. */
me.get('/activity', requireAuth, async (c) => {
  const user = currentUser(c);

  const [reports, favourites, watching, adoption, volunteering] = await Promise.all([
    db.from('rescues').select('*').eq('reporter_id', user.id).order('created_at', { ascending: false }),
    db
      .from('animal_favourites')
      .select('animal:animals (*, organization:organizations (id, name, slug, logo_url, verified))')
      .eq('profile_id', user.id),
    db
      .from('rescue_watchers')
      .select('rescue:rescues (id, reference, title, status, urgency, photos, city, created_at)')
      .eq('profile_id', user.id),
    db
      .from('adoption_applications')
      .select('*, animal:animals (id, name, slug, photos, species, status)')
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false }),
    db
      .from('volunteer_applications')
      .select('*, opportunity:volunteer_opportunities (id, title, city, starts_at)')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  return ok(c, {
    reports: reports.data ?? [],
    favourites: (favourites.data ?? []).map((f) => f.animal).filter(Boolean),
    watching: (watching.data ?? []).map((w) => w.rescue).filter(Boolean),
    adoption_applications: adoption.data ?? [],
    volunteer_applications: volunteering.data ?? [],
  });
});

export default me;
