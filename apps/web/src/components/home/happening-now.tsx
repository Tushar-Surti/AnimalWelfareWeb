import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MapPin, Clock, Siren } from 'lucide-react';
import type { Rescue, Animal } from '@aww/shared';
import { SPECIES_EMOJI, RESCUE_STATUS_LABEL, formatAge, timeAgo } from '@aww/shared';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Reveal } from '@/components/motion/reveal';
import { Paw, Squiggle } from '@/components/ui/doodles';

const URGENCY_TONE = { critical: 'critical', urgent: 'peach', stable: 'sage' } as const;

/**
 * Replaces the old impact-counter block.
 *
 * Counters on a young platform are self-defeating: "0 animals adopted" is the
 * least persuasive thing a rescue site can put above the fold. Real animals
 * with real faces do the same job honestly at any scale — one waiting dog is
 * still a reason to click.
 */
export function HappeningNow({ rescues, animals }: { rescues: Rescue[]; animals: Animal[] }) {
  if (rescues.length === 0 && animals.length === 0) return null;

  return (
    <section className="relative overflow-hidden px-6 py-24">
      <Paw className="pointer-events-none absolute -left-12 top-20 size-44 rotate-12 text-blush/[0.06]" />

      <div className="mx-auto max-w-7xl">
        {rescues.length > 0 && (
          <>
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.18em] text-critical-deep">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-critical opacity-70" />
                    <span className="relative inline-flex size-2 rounded-full bg-critical" />
                  </span>
                  Open right now
                </span>
                <h2 className="mt-3 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold">
                  Someone stopped for these
                </h2>
                <p className="mt-3 max-w-lg text-lg text-ink-soft">
                  Real reports from real streets. If you can get to one, claim it.
                </p>
              </div>
              <Link
                href="/rescues"
                className="group inline-flex items-center gap-2 font-display font-semibold text-blush hover:underline underline-offset-4"
              >
                See the map
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>

            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {rescues.slice(0, 3).map((rescue, i) => (
                <Reveal key={rescue.id} delay={i * 0.07}>
                  <Link
                    href={`/rescues/${rescue.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[2rem] border-2 border-line bg-paper transition-shadow hover:shadow-[0_1.25rem_2.5rem_-0.75rem_#4a373033]"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-cream-deep">
                      {rescue.photos[0] ? (
                        <Image
                          src={rescue.photos[0]}
                          alt={rescue.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <span className="grid size-full place-items-center text-6xl">
                          {SPECIES_EMOJI[rescue.species]}
                        </span>
                      )}
                      <span className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                        <Badge tone={URGENCY_TONE[rescue.urgency]}>{rescue.urgency}</Badge>
                        <Badge tone="neutral">{RESCUE_STATUS_LABEL[rescue.status]}</Badge>
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="font-display text-lg font-semibold group-hover:text-blush">
                        {rescue.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{rescue.description}</p>
                      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-xs text-ink-faint">
                        {rescue.city && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {rescue.city}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {timeAgo(rescue.createdAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </>
        )}

        {animals.length > 0 && (
          <>
            <Squiggle className="mx-auto my-16 w-32 text-butter" />

            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="font-display text-sm font-bold uppercase tracking-[0.18em] text-blush">
                  Ready when you are
                </span>
                <h2 className="mt-3 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold">
                  Already safe. Still waiting.
                </h2>
              </div>
              <Link
                href="/adopt"
                className="group inline-flex items-center gap-2 font-display font-semibold text-blush hover:underline underline-offset-4"
              >
                Meet everyone
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>

            <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
              {animals.slice(0, 4).map((animal, i) => (
                <Reveal key={animal.id} delay={i * 0.06}>
                  <Link
                    href={`/adopt/${animal.id}`}
                    className="group block overflow-hidden rounded-[2rem] border-2 border-line bg-paper transition-shadow hover:shadow-[0_1.25rem_2.5rem_-0.75rem_#4a373033]"
                  >
                    <div className="relative aspect-square overflow-hidden bg-cream-deep">
                      {animal.photos[0] ? (
                        <Image
                          src={animal.photos[0]}
                          alt={animal.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <span className="grid size-full place-items-center text-5xl">
                          {SPECIES_EMOJI[animal.species]}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="truncate font-display text-lg font-semibold group-hover:text-blush">
                        {animal.name}
                      </h3>
                      <p className="truncate text-sm text-ink-soft">
                        {formatAge(animal.ageMonths)}
                        {animal.breed ? ` · ${animal.breed}` : ''}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </>
        )}

        {rescues.length > 0 && (
          <Reveal className="mt-16 text-center">
            <ButtonLink href="/rescues/new" variant="critical" size="lg">
              <Siren className="size-5" />
              Report one you have seen
            </ButtonLink>
          </Reveal>
        )}
      </div>
    </section>
  );
}
