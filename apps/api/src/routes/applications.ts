import { Hono } from 'hono';
import { applicationDecisionSchema, uuid } from '@aww/shared';
import { db, unwrap } from '../lib/supabase.js';
import { ok } from '../lib/respond.js';
import { ApiError } from '../lib/errors.js';
import { requireAuth, currentUser } from '../middleware/auth.js';
import { assertOrgMember } from '../lib/guards.js';

const applications = new Hono();

/** Applications a signed-in person has sent — adoption and volunteering both. */
applications.get('/mine', requireAuth, async (c) => {
  const user = currentUser(c);

  const [adoption, volunteering] = await Promise.all([
    db
      .from('adoption_applications')
      .select('*, animal:animals (id, name, slug, photos, species, org_id, status)')
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false }),
    db
      .from('volunteer_applications')
      .select('*, opportunity:volunteer_opportunities (id, title, city, starts_at, org_id)')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  return ok(c, { adoption: adoption.data ?? [], volunteering: volunteering.data ?? [] });
});

/** The organization's decision. The database trigger handles the ripple
 *  effects — marking the animal adopted and closing the other applications. */
applications.patch('/:id', requireAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  const { status, note } = applicationDecisionSchema.parse(await c.req.json());
  const user = currentUser(c);

  const { data: application } = await db
    .from('adoption_applications')
    .select('id, applicant_id, status, animal:animals (id, org_id)')
    .eq('id', id)
    .maybeSingle();
  if (!application) throw ApiError.notFound();

  const animal = application.animal as unknown as { id: string; org_id: string } | null;
  if (!animal) throw ApiError.notFound();

  // Applicants may only withdraw; everything else is the organization's call.
  if (status === 'withdrawn') {
    if (application.applicant_id !== user.id) throw ApiError.forbidden();
  } else {
    assertOrgMember(user, animal.org_id);
  }

  if (application.status === 'approved' && status !== 'approved') {
    throw ApiError.conflict('This adoption was already approved.');
  }

  const row = unwrap(
    await db
      .from('adoption_applications')
      .update({ status, org_note: note ?? null })
      .eq('id', id)
      .select('*, animal:animals (id, name, slug, photos)')
      .single(),
  );

  return ok(c, row);
});

export default applications;
