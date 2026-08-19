import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { compress } from 'hono/compress';
import { env, isProd } from './lib/env.js';
import { errorHandler } from './lib/errors.js';
import { rateLimit } from './middleware/rateLimit.js';

import me from './routes/me.js';
import rescues from './routes/rescues.js';
import organizations from './routes/organizations.js';
import animals from './routes/animals.js';
import applications from './routes/applications.js';
import campaigns from './routes/campaigns.js';
import volunteers from './routes/volunteers.js';
import lostfound from './routes/lostfound.js';
import uploads from './routes/uploads.js';
import notifications from './routes/notifications.js';
import stats from './routes/stats.js';

const app = new Hono();

app.use('*', secureHeaders());
app.use('*', compress());
if (!isProd) app.use('*', logger());

app.use(
  '*',
  cors({
    origin: (origin) => {
      // Same-origin and server-to-server calls arrive without an Origin header.
      if (!origin) return origin;
      if (env.CORS_ORIGINS.includes(origin)) return origin;
      // Vercel builds every branch on its own subdomain; allowing the project's
      // preview domains keeps staging usable without redeploying the API.
      if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return origin;
      return null;
    },
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'Retry-After'],
    maxAge: 86400,
    credentials: true,
  }),
);

// Blanket ceiling. Individual routes add tighter limits of their own.
app.use('/api/*', rateLimit({ limit: 300, windowMs: 60_000, key: 'global' }));

app.onError(errorHandler);
app.notFound((c) =>
  c.json({ ok: false, error: { code: 'not_found', message: 'No route here. Check the URL.' } }, 404),
);

/** Render pings this to decide whether the instance is alive. */
app.get('/health', (c) => c.json({ ok: true, service: 'aww-api', uptime: process.uptime() }));

app.get('/', (c) =>
  c.json({
    name: 'A.W.W. Helpers API',
    version: '2.0.0',
    docs: 'https://github.com/Tushar-Surti/AnimalWelfareWeb',
  }),
);

app.route('/api/me', me);
app.route('/api/rescues', rescues);
app.route('/api/organizations', organizations);
app.route('/api/animals', animals);
app.route('/api/applications', applications);
app.route('/api/campaigns', campaigns);
app.route('/api/volunteers', volunteers);
app.route('/api/lost-found', lostfound);
app.route('/api/uploads', uploads);
app.route('/api/notifications', notifications);
app.route('/api/stats', stats);

serve({ fetch: app.fetch, port: env.PORT, hostname: '0.0.0.0' }, (info) => {
  console.log(`\n  🐾 A.W.W. Helpers API on http://localhost:${info.port}`);
  console.log(`     env: ${env.NODE_ENV}  ·  cors: ${env.CORS_ORIGINS.join(', ')}\n`);
});

export default app;
