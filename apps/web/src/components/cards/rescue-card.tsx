'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, Clock, ShieldCheck } from 'lucide-react';
import type { Rescue } from '@aww/shared';
import { SPECIES_EMOJI, RESCUE_STATUS_LABEL, formatDistance, timeAgo } from '@aww/shared';
import { Badge } from '@/components/ui/badge';
import { Paw } from '@/components/ui/doodles';
import { cn } from '@/lib/utils';

const URGENCY_TONE = { critical: 'critical', urgent: 'peach', stable: 'sage' } as const;
const STATUS_TONE = {
  reported: 'neutral',
  claimed: 'sky',
  in_care: 'lilac',
  resolved: 'sage',
  closed: 'neutral',
} as const;

export function RescueCard({
  rescue,
  onHover,
  active,
}: {
  rescue: Rescue;
  onHover?: (id: string | null) => void;
  active?: boolean;
}) {
  const photo = rescue.photos[0];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => onHover?.(rescue.id)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        'group overflow-hidden rounded-[1.75rem] border-2 bg-paper transition-colors',
        // Hovering a card highlights its pin on the map, so the border has to
        // make the pairing obvious in both directions.
        active ? 'border-blush shadow-[0_1rem_2rem_-0.75rem_#4a373033]' : 'border-line',
      )}
    >
      <Link href={`/rescues/${rescue.id}`} className="flex gap-4 p-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border-2 border-line bg-cream-deep sm:size-28">
          {photo ? (
            <Image
              src={photo}
              alt={rescue.title}
              fill
              sizes="112px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="grid size-full place-items-center text-3xl">
              {SPECIES_EMOJI[rescue.species]}
            </span>
          )}
          {rescue.urgency === 'critical' && rescue.status === 'reported' && (
            <span className="absolute inset-x-0 bottom-0 bg-critical py-0.5 text-center text-[0.6rem] font-bold uppercase tracking-wide text-white">
              Urgent
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={URGENCY_TONE[rescue.urgency]}>{SPECIES_EMOJI[rescue.species]} {rescue.urgency}</Badge>
            <Badge tone={STATUS_TONE[rescue.status]}>{RESCUE_STATUS_LABEL[rescue.status]}</Badge>
          </div>

          <h3 className="mt-2 truncate font-display text-lg font-semibold group-hover:text-blush">
            {rescue.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{rescue.description}</p>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
            {rescue.distanceKm !== undefined && (
              <span className="inline-flex items-center gap-1 font-semibold text-blush">
                <MapPin className="size-3.5" />
                {formatDistance(rescue.distanceKm)}
              </span>
            )}
            {rescue.city && <span>{rescue.city}</span>}
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {timeAgo(rescue.createdAt)}
            </span>
          </div>

          {rescue.organization && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-2.5 py-1 text-xs font-semibold text-sage-deep">
              <ShieldCheck className="size-3.5" />
              {rescue.organization.name} is on it
            </p>
          )}
        </div>
      </Link>
    </motion.article>
  );
}

/** Shown when a filter combination returns nothing. */
export function EmptyRescues({ radiusKm }: { radiusKm: number }) {
  return (
    <div className="rounded-[1.75rem] border-2 border-dashed border-line-strong bg-paper/60 px-6 py-14 text-center">
      <Paw className="mx-auto size-14 text-sage/40" />
      <h3 className="mt-4 font-display text-xl font-semibold">Nothing within {radiusKm} km</h3>
      <p className="mx-auto mt-2 max-w-sm text-ink-soft">
        Genuinely good news. Widen the radius if you want to help further afield, or check back later.
      </p>
    </div>
  );
}
