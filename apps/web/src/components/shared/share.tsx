'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Share2, Check, Copy, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Sharing a rescue post is how it actually reaches someone who can help — a
 * report seen by twelve people in the right neighbourhood beats one seen by a
 * thousand strangers.
 *
 * Native share sheet where the browser has one (every phone), and an explicit
 * WhatsApp link plus copy-to-clipboard everywhere else. WhatsApp gets its own
 * button rather than hiding behind the share sheet because it is where these
 * links travel in practice.
 */
export function Share({
  title,
  text,
  className,
  variant = 'full',
}: {
  title: string;
  text: string;
  className?: string;
  variant?: 'full' | 'icon';
}) {
  const [copied, setCopied] = useState(false);

  const url = typeof window === 'undefined' ? '' : window.location.href;
  const message = `${text}\n\n${url}`;

  async function nativeShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // The user dismissing the sheet throws; fall through to copying, which
        // is a reasonable second-best rather than an error.
      }
    }
    await copy();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard blocked — the WhatsApp button still works */
    }
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={nativeShare}
        aria-label={`Share: ${title}`}
        className={cn(
          'grid size-10 place-items-center rounded-full border-2 border-line bg-paper/90 text-ink-soft backdrop-blur transition-colors hover:border-blush hover:text-blush',
          className,
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span key="ok" initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 0.6 }}>
              <Check className="size-[18px] text-sage-deep" />
            </motion.span>
          ) : (
            <motion.span key="share" initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 0.6 }}>
              <Share2 className="size-[18px]" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    );
  }

  return (
    <div className={cn('rounded-[1.75rem] border-2 border-line bg-paper p-5', className)}>
      <p className="font-display font-semibold">Share this</p>
      <p className="mt-1 text-sm text-ink-soft">
        The person who can help is probably two streets away, not two cities.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-sage-deep bg-sage px-5 py-3 font-display text-sm font-semibold text-white shadow-[0.2rem_0.2rem_0_var(--color-sage-deep)] transition-transform hover:-translate-y-0.5"
        >
          <MessageCircle className="size-4" />
          WhatsApp
        </a>

        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-line-strong bg-paper px-5 py-3 font-display text-sm font-semibold shadow-[0.2rem_0.2rem_0_var(--color-line-strong)] transition-transform hover:-translate-y-0.5"
        >
          {copied ? <Check className="size-4 text-sage-deep" /> : <Copy className="size-4" />}
          {copied ? 'Link copied' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}
