import { Hono } from 'hono';
import { uploadRequestSchema } from '@aww/shared';
import { db, unwrap } from '../lib/supabase.js';
import { ok } from '../lib/respond.js';
import { requireAuth, optionalAuth, currentUser } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { env } from '../lib/env.js';

const uploads = new Hono();

const EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

/**
 * Hands the browser a short-lived signed upload URL so image bytes go straight
 * to Supabase Storage instead of through this API. Render's free tier would
 * not enjoy proxying 8MB photos, and the browser gets a real progress bar.
 *
 * The path is generated server-side — the client's filename is used only for
 * its extension, never as a path, so it cannot write outside its own folder.
 */
uploads.post('/sign', optionalAuth, rateLimit({ limit: 40, windowMs: 60_000, key: 'upload' }), async (c) => {
  const { bucket, contentType } = uploadRequestSchema.parse(await c.req.json());
  const user = c.get('user');

  // Rescue and lost-pet photos may come from someone without an account.
  if (!user && bucket !== 'rescues' && bucket !== 'lostfound') {
    return c.json({ ok: false, error: { code: 'unauthorized', message: 'Please sign in to upload.' } }, 401);
  }

  const folder = user?.id ?? 'anonymous';
  const name = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}.${EXTENSION[contentType] ?? 'jpg'}`;
  const path = `${folder}/${name}`;

  const signed = unwrap(await db.storage.from(bucket).createSignedUploadUrl(path));

  return ok(c, {
    url: signed.signedUrl,
    token: signed.token,
    path,
    publicUrl: `${env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`,
  });
});

export default uploads;
