import { cn } from '@/lib/utils';
import type { Accent } from '@/lib/utils';

const TONES: Record<Accent | 'critical' | 'neutral', string> = {
  blush: 'bg-blush-soft text-blush-deep border-blush/40',
  peach: 'bg-peach-soft text-peach-deep border-peach/40',
  butter: 'bg-butter-soft text-butter-deep border-butter/50',
  sage: 'bg-sage-soft text-sage-deep border-sage/40',
  sky: 'bg-sky-soft text-sky-deep border-sky/40',
  lilac: 'bg-lilac-soft text-lilac-deep border-lilac/40',
  critical: 'bg-critical-soft text-critical-deep border-critical/40',
  neutral: 'bg-cream-deep text-ink-soft border-line-strong',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
  ...props
}: React.ComponentProps<'span'> & { tone?: keyof typeof TONES }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold font-display',
        TONES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
