'use client';

import type { PlatformStats } from '@aww/shared';
import { formatCompactINR } from '@aww/shared';
import { CountUp } from '@/components/motion/count-up';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/motion/reveal';
import { Paw, HeartDoodle } from '@/components/ui/doodles';

export function Impact({ stats }: { stats: PlatformStats }) {
  const tiles = [
    { label: 'animals reported', value: stats.rescuesTotal, tone: 'bg-blush-soft border-blush/40 text-blush-deep' },
    { label: 'happy endings', value: stats.rescuesResolved, tone: 'bg-sage-soft border-sage/40 text-sage-deep' },
    { label: 'friends adopted', value: stats.animalsAdopted, tone: 'bg-peach-soft border-peach/40 text-peach-deep' },
    { label: 'pets reunited', value: stats.petsReunited, tone: 'bg-sky-soft border-sky/40 text-sky-deep' },
    { label: 'shelters on board', value: stats.organizations, tone: 'bg-lilac-soft border-lilac/40 text-lilac-deep' },
    {
      label: 'raised for care',
      value: stats.fundsRaised,
      tone: 'bg-butter-soft border-butter/50 text-butter-deep',
      format: formatCompactINR,
    },
  ];

  return (
    <section className="relative overflow-hidden px-6 py-24">
      <Paw className="pointer-events-none absolute -left-10 top-10 size-40 rotate-12 text-blush/[0.07]" />
      <HeartDoodle className="pointer-events-none absolute -right-12 bottom-10 size-48 -rotate-12 text-sage/[0.08]" />

      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center">
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold">
            What this has added up to
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">
            Every number here is a real animal that someone stopped for.
          </p>
        </Reveal>

        <StaggerGroup className="mt-14 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
          {tiles.map((tile) => (
            <StaggerItem key={tile.label}>
              <div className={`rounded-[1.75rem] border-2 p-6 text-center sm:p-8 ${tile.tone}`}>
                <p className="font-display text-[clamp(2rem,5vw,3.25rem)] font-bold leading-none tabular-nums">
                  <CountUp to={tile.value} format={tile.format} />
                </p>
                <p className="mt-2 font-display text-sm font-semibold uppercase tracking-wide opacity-80">
                  {tile.label}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>

        {stats.rescuesTotal === 0 && (
          <Reveal className="mt-10 text-center">
            <p className="inline-block rounded-full border-2 border-dashed border-line-strong bg-paper px-6 py-3 text-ink-soft">
              These start at zero because this platform is brand new. Be the first report. 🐾
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
