'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Auth is the browser's job: supabase-js owns sign-in, session storage and
 * token refresh. The API on Render only ever *verifies* the token it is handed,
 * which keeps refresh logic in one place instead of two.
 */
let client: ReturnType<typeof createBrowserClient> | null = null;

export function supabase() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        'Supabase is not configured. Copy apps/web/.env.example to .env.local and fill it in.',
      );
    }
    client = createBrowserClient(url, key);
  }
  return client;
}
