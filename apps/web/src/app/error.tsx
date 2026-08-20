'use client';

import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Paw } from '@/components/ui/doodles';

/**
 * Catches render-time failures anywhere below the root layout. The most likely
 * cause in production is the API cold-starting on Render's free tier and timing
 * out mid-render, so "try again" really is the correct first advice.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[render error]', error);
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center px-6 py-32">
      <div className="max-w-lg text-center">
        <Paw className="mx-auto size-20 animate-[wiggle_1.4s_ease-in-out_infinite] text-blush/50" />

        <h1 className="mt-7 font-display text-3xl font-semibold">Well, that went sideways</h1>
        <p className="mt-3 text-lg text-ink-soft">
          Something broke while loading this page. If the site has been quiet for a while, the server
          may just be waking up — give it another go in a few seconds.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={reset}>
            <RefreshCw className="size-5" />
            Try again
          </Button>
          <ButtonLink href="/" variant="paper" size="lg">
            Back home
          </ButtonLink>
        </div>

        {/* Next strips messages in production but keeps a digest — worth showing
            so a bug report can actually be traced. */}
        {error.digest && (
          <p className="mt-8 font-mono text-xs text-ink-faint">reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
