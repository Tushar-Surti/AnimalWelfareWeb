// Loads apps/api/.env in development. A no-op in production, where Render
// injects the real environment — dotenv simply finds no file and moves on.
import 'dotenv/config';
import { z } from 'zod';

/** Fail at boot with a readable message rather than at 3am with `undefined`. */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().default(8787),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be the full https://<ref>.supabase.co URL'),
  SUPABASE_ANON_KEY: z.string().min(20, 'SUPABASE_ANON_KEY looks empty'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY looks empty'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  · ${i.path.join('.')}: ${i.message}`);
  console.error(`\nAPI cannot start — environment is incomplete:\n${lines.join('\n')}\n`);
  console.error('Copy apps/api/.env.example to apps/api/.env and fill it in.\n');
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
