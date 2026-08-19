'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The sticker button. Solid fill, a darker outline of its own hue, and a hard
 * offset shadow it presses down into — no blur, no gradient.
 */
const VARIANTS = {
  blush: 'bg-blush text-white border-blush-deep [--sticker-shadow:var(--color-blush-deep)]',
  peach: 'bg-peach text-ink border-peach-deep [--sticker-shadow:var(--color-peach-deep)]',
  butter: 'bg-butter text-ink border-butter-deep [--sticker-shadow:var(--color-butter-deep)]',
  sage: 'bg-sage text-white border-sage-deep [--sticker-shadow:var(--color-sage-deep)]',
  sky: 'bg-sky text-ink border-sky-deep [--sticker-shadow:var(--color-sky-deep)]',
  lilac: 'bg-lilac text-white border-lilac-deep [--sticker-shadow:var(--color-lilac-deep)]',
  critical: 'bg-critical text-white border-critical-deep [--sticker-shadow:var(--color-critical-deep)]',
  paper: 'bg-paper text-ink border-line-strong [--sticker-shadow:var(--color-line-strong)]',
  ghost: 'bg-transparent text-ink border-transparent shadow-none hover:bg-cream-deep',
} as const;

const SIZES = {
  sm: 'h-9 px-4 text-sm gap-1.5',
  md: 'h-11 px-6 text-[0.95rem] gap-2',
  lg: 'h-14 px-8 text-lg gap-2.5',
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

type BaseProps = {
  variant?: ButtonVariant;
  size?: keyof typeof SIZES;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
};

const base =
  'relative inline-flex items-center justify-center rounded-full border-2 font-display font-semibold ' +
  'whitespace-nowrap select-none transition-[transform,box-shadow] duration-150 ' +
  'disabled:opacity-55 disabled:pointer-events-none';

export const Button = forwardRef<HTMLButtonElement, BaseProps & Omit<HTMLMotionProps<'button'>, keyof BaseProps>>(
  function Button({ variant = 'blush', size = 'md', loading, className, children, disabled, ...props }, ref) {
    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        // Spring, not a linear tween — the whole site's motion language.
        whileHover={{ y: -2, x: -2 }}
        whileTap={{ y: 2, x: 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        className={cn(base, VARIANTS[variant], SIZES[size], variant !== 'ghost' && 'sticker', className)}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </motion.button>
    );
  },
);

/** Same look, renders an anchor. Kept separate so the button never has to
 *  guess whether it is navigating or acting. */
export function ButtonLink({
  href,
  variant = 'blush',
  size = 'md',
  className,
  children,
  ...props
}: BaseProps & { href: string } & React.ComponentProps<typeof Link>) {
  return (
    <Link
      href={href}
      className={cn(
        base,
        VARIANTS[variant],
        SIZES[size],
        variant !== 'ghost' && 'sticker sticker-hover sticker-press',
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
