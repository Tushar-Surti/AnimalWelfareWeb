'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Flag, Truck, HeartPulse, PartyPopper, MessageCircle, XCircle } from 'lucide-react';
import type { RescueUpdate, RescueStatus } from '@aww/shared';
import { timeAgo } from '@aww/shared';

const STEP: Record<RescueStatus | 'note', { icon: typeof Flag; tone: string; ring: string }> = {
  reported: { icon: Flag, tone: 'bg-blush text-white', ring: 'border-blush-deep' },
  claimed: { icon: Truck, tone: 'bg-sky text-ink', ring: 'border-sky-deep' },
  in_care: { icon: HeartPulse, tone: 'bg-lilac text-white', ring: 'border-lilac-deep' },
  resolved: { icon: PartyPopper, tone: 'bg-sage text-white', ring: 'border-sage-deep' },
  closed: { icon: XCircle, tone: 'bg-cream-deep text-ink-soft', ring: 'border-line-strong' },
  note: { icon: MessageCircle, tone: 'bg-butter text-ink', ring: 'border-butter-deep' },
};

export function Timeline({ updates }: { updates: RescueUpdate[] }) {
  if (updates.length === 0) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-line-strong px-5 py-8 text-center text-ink-soft">
        No updates yet. The moment a rescuer claims this, it shows up here.
      </p>
    );
  }

  return (
    <ol className="relative space-y-5">
      {/* The spine, drawn behind the icons and stopped short of the last one so
          it does not dangle past the final entry. */}
      <span
        className="absolute left-[1.4rem] top-4 w-0.5 bg-line"
        style={{ height: 'calc(100% - 3rem)' }}
        aria-hidden
      />

      {updates.map((update, i) => {
        const kind = update.statusTo ?? 'note';
        const { icon: Icon, tone, ring } = STEP[kind] ?? STEP.note;
        const who = update.organization?.name ?? update.author?.fullName ?? 'A helper';

        return (
          <motion.li
            key={update.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i, 8) * 0.06, duration: 0.4 }}
            className="relative flex gap-4"
          >
            <span className={`relative z-10 grid size-11 shrink-0 place-items-center rounded-full border-2 ${ring} ${tone}`}>
              <Icon className="size-5" strokeWidth={2.2} />
            </span>

            <div className="min-w-0 flex-1 rounded-2xl border-2 border-line bg-paper p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-display font-semibold">{who}</span>
                <span className="text-xs text-ink-faint">{timeAgo(update.createdAt)}</span>
              </div>
              <p className="mt-1 text-ink-soft">{update.message}</p>

              {update.photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {update.photos.map((photo, n) => (
                    <div key={photo} className="relative size-20 overflow-hidden rounded-xl border-2 border-line">
                      <Image src={photo} alt={`Update photo ${n + 1}`} fill sizes="80px" className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
