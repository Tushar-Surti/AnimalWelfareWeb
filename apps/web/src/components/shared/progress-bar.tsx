'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Fundraising progress. Fills from zero when it scrolls into view; caps the
 *  visual bar at 100% while still reporting overfunded totals in the label. */
export function ProgressBar({
  value,
  goal,
  tone = 'butter',
  className,
}: {
  value: number;
  goal: number;
  tone?: 'butter' | 'sage' | 'blush';
  className?: string;
}) {
  const reduced = useReducedMotion();
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;

  const fill = { butter: 'bg-butter', sage: 'bg-sage', blush: 'bg-blush' }[tone];

  return (
    <div
      className={cn('h-4 w-full overflow-hidden rounded-full border-2 border-line bg-cream-deep', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.span
        className={cn('block h-full rounded-full', fill)}
        initial={{ width: reduced ? `${pct}%` : 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
