'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, MailWarning } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ButtonLink } from '@/components/ui/button';
import { Paw } from '@/components/ui/doodles';

/**
 * Where email confirmation and magic links land.
 *
 * Supabase uses the PKCE flow, so the link returns an authorization `code`
 * rather than a session — it has to be traded in before the user is actually
 * signed in. Without this route the code just sits in the URL and the visitor
 * looks signed out despite having clicked the link.
 */
function Callback() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = params.get('next') ?? '/dashboard';
    const code = params.get('code');

    // Supabase reports link problems as query params, not as a failed exchange.
    const linkError = params.get('error_description') ?? params.get('error');
    if (linkError) {
      setError(
        linkError.toLowerCase().includes('expired')
          ? 'That link has expired. Confirmation links are only good for a short while — request a new one by signing in.'
          : linkError,
      );
      return;
    }

    void (async () => {
      const client = supabase();

      // detectSessionInUrl may have already consumed the code by the time this
      // effect runs; exchanging it a second time would fail, so check first.
      const { data: existing } = await client.auth.getSession();
      if (existing.session) {
        router.replace(next);
        return;
      }

      if (!code) {
        setError('This link is missing its confirmation code. Try opening it directly from the email.');
        return;
      }

      const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        setError(`${exchangeError.message}. Try signing in with your email and password instead.`);
        return;
      }

      router.replace(next);
      router.refresh();
    })();
  }, [params, router]);

  if (error) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-md rounded-[2.5rem] border-2 border-line bg-paper p-10 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full border-2 border-butter-deep bg-butter">
            <MailWarning className="size-8 text-ink" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-semibold">That link did not work</h1>
          <p className="mt-3 text-ink-soft">{error}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/sign-in" size="lg">
              Go to sign in
            </ButtonLink>
            <ButtonLink href="/" variant="paper" size="lg">
              Back home
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="text-center">
        <Paw className="mx-auto size-14 animate-[wiggle_1.2s_ease-in-out_infinite] text-blush" />
        <p className="mt-5 inline-flex items-center gap-2 font-display text-lg font-semibold">
          <Loader2 className="size-5 animate-spin" />
          Signing you in…
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Callback />
    </Suspense>
  );
}
