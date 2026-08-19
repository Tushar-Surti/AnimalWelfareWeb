'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Scroll-in reveal. Framer's `whileInView` handles this better than a
 * ScrollTrigger would for one-shot entrances — it needs no measurement pass and
 * survives route changes. GSAP is reserved for the things it is actually better
 * at: pinning, scrubbed timelines, and the parallax in the hero.
 */
const DIRECTIONS = {
  up: { y: 28, x: 0 },
  down: { y: -28, x: 0 },
  left: { x: 28, y: 0 },
  right: { x: -28, y: 0 },
  none: { x: 0, y: 0 },
} as const;

export function Reveal({
  children,
  delay = 0,
  from = 'up',
  className,
  once = true,
}: {
  children: React.ReactNode;
  delay?: number;
  from?: keyof typeof DIRECTIONS;
  className?: string;
  once?: boolean;
}) {
  const reduced = useReducedMotion();
  const offset = reduced ? DIRECTIONS.none : DIRECTIONS[from];

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      // Fires a little before the element reaches the fold, so content is
      // already settled by the time the reader's eye lands on it.
      viewport={{ once, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Parent that staggers its Reveal-shaped children. */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

export function StaggerGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

/** Splits a heading into words and floats each one in. Words, not letters —
 *  per-letter animation shreds screen-reader output and reads as a gimmick. */
export function RevealWords({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  if (reduced) return <span className={className}>{text}</span>;

  return (
    <span className={cn('inline-flex flex-wrap', className)} aria-label={text}>
      {text.split(' ').map((word, i) => (
        <span key={`${word}-${i}`} className="overflow-hidden inline-flex pb-[0.12em] mr-[0.28em]" aria-hidden>
          <motion.span
            className="inline-block"
            initial={{ y: '110%', rotate: 4 }}
            animate={{ y: 0, rotate: 0 }}
            transition={{ duration: 0.75, delay: delay + i * 0.055, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
