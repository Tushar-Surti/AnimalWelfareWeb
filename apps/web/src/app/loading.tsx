import { Paw } from '@/components/ui/doodles';

/** Route-level loading state. Deliberately minimal — a bouncing paw reads as
 *  "working" without pretending to be a skeleton of a page we cannot predict. */
export default function Loading() {
  return (
    <div className="grid min-h-[70dvh] place-items-center px-6">
      <div className="text-center">
        <Paw className="mx-auto size-12 animate-[float_1.6s_ease-in-out_infinite] text-blush" />
        <p className="mt-4 font-display font-semibold text-ink-soft">Just a moment…</p>
      </div>
    </div>
  );
}
