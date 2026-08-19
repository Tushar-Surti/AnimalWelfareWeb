'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, MapPin, ShieldCheck, Syringe } from 'lucide-react';
import type { Animal } from '@aww/shared';
import { SPECIES_EMOJI, formatAge, formatDistance, formatCurrency } from '@aww/shared';
import { api } from '@/lib/api';
import { useSession } from '@/hooks/use-session';
import { Badge } from '@/components/ui/badge';
import { cn, pickBy, TILTS } from '@/lib/utils';

export function AnimalCard({ animal, index = 0 }: { animal: Animal; index?: number }) {
  const { token } = useSession();
  const [favourited, setFavourited] = useState(Boolean(animal.favourited));
  const [bouncing, setBouncing] = useState(false);

  // Same animal, same tilt, every time — a card that changes angle on re-render
  // reads as a bug.
  const tilt = pickBy(animal.id, TILTS);

  async function toggleFavourite(event: React.MouseEvent) {
    event.preventDefault();
    if (!token) {
      window.location.href = `/sign-in?next=/adopt/${animal.id}`;
      return;
    }
    // Optimistic: the heart must respond instantly or it feels broken.
    const next = !favourited;
    setFavourited(next);
    setBouncing(true);
    setTimeout(() => setBouncing(false), 400);
    try {
      await (next
        ? api.post(`/api/animals/${animal.id}/favourite`, undefined, { token })
        : api.delete(`/api/animals/${animal.id}/favourite`, { token }));
    } catch {
      setFavourited(!next);
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.5, delay: Math.min(index, 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={cn('group', tilt)}
    >
      <Link
        href={`/adopt/${animal.id}`}
        className="block overflow-hidden rounded-[2rem] border-2 border-line bg-paper shadow-[0_0.75rem_2rem_-0.75rem_#4a373026] transition-shadow hover:shadow-[0_1.25rem_2.5rem_-0.75rem_#4a373033]"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-cream-deep">
          {animal.photos[0] ? (
            <Image
              src={animal.photos[0]}
              alt={animal.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <span className="grid size-full place-items-center text-6xl">
              {SPECIES_EMOJI[animal.species]}
            </span>
          )}

          <button
            type="button"
            onClick={toggleFavourite}
            aria-label={favourited ? `Remove ${animal.name} from favourites` : `Save ${animal.name}`}
            aria-pressed={favourited}
            className={cn(
              'absolute right-3 top-3 grid size-10 place-items-center rounded-full border-2 backdrop-blur transition-colors',
              favourited
                ? 'border-blush-deep bg-blush text-white'
                : 'border-line-strong bg-paper/90 text-ink-soft hover:text-blush',
              bouncing && 'animate-[pop_0.35s_var(--ease-bounce)]',
            )}
          >
            <Heart className={cn('size-5', favourited && 'fill-current')} />
          </button>

          {animal.fosterOnly && (
            <span className="absolute left-3 top-3">
              <Badge tone="lilac">Foster only</Badge>
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="truncate font-display text-xl font-semibold group-hover:text-blush">
              {animal.name}
            </h3>
            <span className="shrink-0 text-sm text-ink-faint">{formatAge(animal.ageMonths)}</span>
          </div>

          <p className="mt-1 truncate text-sm text-ink-soft">
            {[animal.breed, animal.sex !== 'unknown' ? animal.sex : null].filter(Boolean).join(' · ') ||
              'Looking for a sofa of their own'}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {animal.vaccinated && (
              <Badge tone="sage">
                <Syringe className="size-3" /> Vaccinated
              </Badge>
            )}
            {animal.sterilised && <Badge tone="sky">Sterilised</Badge>}
            {animal.adoptionFee === 0 && <Badge tone="butter">Free to adopt</Badge>}
            {animal.adoptionFee > 0 && <Badge tone="butter">{formatCurrency(animal.adoptionFee)}</Badge>}
          </div>

          <div className="mt-4 flex items-center justify-between border-t-2 border-line pt-3 text-xs text-ink-faint">
            <span className="inline-flex min-w-0 items-center gap-1">
              {animal.organization?.verified && <ShieldCheck className="size-3.5 shrink-0 text-sage-deep" />}
              <span className="truncate">{animal.organization?.name ?? animal.city}</span>
            </span>
            {animal.distanceKm !== undefined && (
              <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-blush">
                <MapPin className="size-3.5" />
                {formatDistance(animal.distanceKm)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
