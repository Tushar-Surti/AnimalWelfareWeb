import { Hono } from 'hono';
import { createCampaignSchema, updateCampaignSchema, donationSchema, slugify, uuid } from '@aww/shared';
import { z } from 'zod';
import { db, unwrap } from '../lib/supabase.js';
import { ok, created, paginateWithCount } from '../lib/respond.js';
import { snakify, definedOnly } from '../lib/case.js';
import { ApiError } from '../lib/errors.js';
import { optionalAuth, requireAuth, currentUser } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { assertOrgMember, assertOwnsVia } from '../lib/guards.js';

const campaigns = new Hono();
const ORG_SELECT = 'organization:organizations (id, name, slug, logo_url, verified)';

campaigns.get('/', async (c) => {
  const q = z
    .object({
      status: z.enum(['active', 'funded', 'closed']).optional(),
      orgId: uuid.optional(),
      limit: z.coerce.number().int().min(1).max(50).default(12),
      offset: z.coerce.number().int().min(0).default(0),
    })
    .parse(c.req.query());

  let query = db.from('campaigns').select(`*, ${ORG_SELECT}`, { count: 'exact' }).neq('status', 'draft');
  if (q.status) query = query.eq('status', q.status);
  if (q.orgId) query = query.eq('org_id', q.orgId);

  const { data, count } = await query
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })
    .range(q.offset, q.offset + q.limit - 1);

  return ok(c, paginateWithCount(data ?? [], count ?? 0, q.limit, q.offset));
});

campaigns.get('/:handle', async (c) => {
  const handle = c.req.param('handle');
  const column = uuid.safeParse(handle).success ? 'id' : 'slug';

  const { data: campaign } = await db.from('campaigns').select(`*, ${ORG_SELECT}`).eq(column, handle).maybeSingle();
  if (!campaign) throw ApiError.notFound('That campaign has ended or never existed.');

  // Only succeeded gifts, and only the fields a public wall may show.
  const { data: donors } = await db
    .from('donations')
    .select('id, donor_name, amount, currency, message, anonymous, created_at')
    .eq('campaign_id', campaign.id)
    .eq('status', 'succeeded')
    .order('created_at', { ascending: false })
    .limit(20);

  const recent = (donors ?? []).map((d) => ({ ...d, donor_name: d.anonymous ? null : d.donor_name }));

  return ok(c, { ...campaign, recent_donors: recent });
});

campaigns.post('/', requireAuth, async (c) => {
  const body = await c.req.json();
  const orgId = uuid.parse(body.orgId);
  const input = createCampaignSchema.parse(body);
  assertOrgMember(currentUser(c), orgId);

  const base = slugify(input.title) || 'campaign';
  let slug = base;
  for (let n = 1; n < 50; n += 1) {
    const { data } = await db.from('campaigns').select('id').eq('slug', slug).maybeSingle();
    if (!data) break;
    slug = `${base}-${n + 1}`;
  }

  const row = unwrap(
    await db
      .from('campaigns')
      .insert({
        ...snakify(input),
        deadline: input.deadline ? input.deadline.toISOString().slice(0, 10) : null,
        org_id: orgId,
        slug,
      })
      .select(`*, ${ORG_SELECT}`)
      .single(),
  );
  return created(c, row);
});

campaigns.patch('/:id', requireAuth, async (c) => {
  const id = uuid.parse(c.req.param('id'));
  const input = updateCampaignSchema.parse(await c.req.json());
  await assertOwnsVia(currentUser(c), 'campaigns', id);

  const patch = definedOnly(snakify(input));
  if (input.deadline) patch.deadline = input.deadline.toISOString().slice(0, 10);

  const row = unwrap(await db.from('campaigns').update(patch).eq('id', id).select(`*, ${ORG_SELECT}`).single());
  return ok(c, row);
});

/**
 * Donation intent.
 *
 * The row is written as `pending` and only becomes `succeeded` when a payment
 * provider confirms it — the campaign's raised_amount trigger keys off that
 * status, so an abandoned checkout never inflates a total. Wiring Razorpay or
 * Stripe means creating their order here and confirming in the webhook below;
 * nothing else in the schema has to change.
 */
campaigns.post('/:id/donate', optionalAuth, rateLimit({ limit: 20, windowMs: 60_000, key: 'donate' }), async (c) => {
  const id = uuid.parse(c.req.param('id'));
  const input = donationSchema.parse(await c.req.json());
  const user = c.get('user');

  const { data: campaign } = await db.from('campaigns').select('id, status, currency').eq('id', id).maybeSingle();
  if (!campaign) throw ApiError.notFound();
  if (campaign.status === 'closed') throw ApiError.conflict('This campaign is no longer accepting donations.');

  const donorName = input.donorName ?? user?.profile.fullName ?? null;
  const donorEmail = input.donorEmail ?? user?.email ?? null;
  if (!donorEmail) throw ApiError.badRequest('We need an email to send your receipt.');

  const row = unwrap(
    await db
      .from('donations')
      .insert({
        campaign_id: id,
        donor_id: user?.id ?? null,
        donor_name: donorName,
        donor_email: donorEmail,
        amount: input.amount,
        currency: campaign.currency,
        message: input.message ?? null,
        anonymous: input.anonymous,
        status: 'pending',
        provider: 'manual',
      })
      .select('id, amount, currency, status')
      .single(),
  );

  return created(c, {
    donation: row,
    // The frontend sends the donor here to complete payment. With a real
    // gateway this becomes the provider's checkout URL / order id.
    next: { kind: 'confirm', confirmUrl: `/api/campaigns/${id}/donations/${row.id}/confirm` },
  });
});

/**
 * Payment confirmation. Today this is the manual provider's endpoint; a real
 * gateway would POST its signed webhook here instead and the signature check
 * would replace the reference lookup.
 */
campaigns.post('/:id/donations/:donationId/confirm', async (c) => {
  const donationId = uuid.parse(c.req.param('donationId'));
  const { reference } = z.object({ reference: z.string().trim().min(4).max(120) }).parse(await c.req.json());

  const { data: donation } = await db
    .from('donations')
    .select('id, status')
    .eq('id', donationId)
    .maybeSingle();
  if (!donation) throw ApiError.notFound();

  // Idempotent: a gateway that retries its webhook must not double-count.
  if (donation.status === 'succeeded') return ok(c, { alreadyConfirmed: true });

  const row = unwrap(
    await db
      .from('donations')
      .update({ status: 'succeeded', provider_ref: reference })
      .eq('id', donationId)
      .eq('status', 'pending')
      .select('id, amount, currency, status')
      .single(),
  );

  return ok(c, row);
});

export default campaigns;
