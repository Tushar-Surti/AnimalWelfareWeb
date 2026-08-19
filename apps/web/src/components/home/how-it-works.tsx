'use client';

import { motion } from 'framer-motion';
import { Camera, Radio, PartyPopper } from 'lucide-react';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/motion/reveal';
import { Squiggle } from '@/components/ui/doodles';

const STEPS = [
  {
    icon: Camera,
    title: 'Snap and send',
    body: 'A photo, a pin on the map, a phone number. That is the whole form. No account needed — the animal cannot wait for you to verify an email.',
    tone: 'bg-blush text-white border-blush-deep',
    shadow: 'var(--color-blush-deep)',
  },
  {
    icon: Radio,
    title: 'Every shelter nearby hears it',
    body: 'We fan the report out to verified rescuers within range, sorted by how close they are and how urgent you marked it. The first to claim it takes charge.',
    tone: 'bg-sky text-ink border-sky-deep',
    shadow: 'var(--color-sky-deep)',
  },
  {
    icon: PartyPopper,
    title: 'Watch it end well',
    body: 'Photos, vet updates, and a status you can follow all the way to "safe". Most reporters never learn what happened next. Here you always do.',
    tone: 'bg-sage text-white border-sage-deep',
    shadow: 'var(--color-sage-deep)',
  },
];

export function HowItWorks() {
  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="font-display text-sm font-bold uppercase tracking-[0.2em] text-blush">
            How it works
          </span>
          <h2 className="mt-3 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold">
            Three steps. About{' '}
            <span className="underline-doodle">thirty seconds</span>.
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            The old way was to call six shelters and hope one picked up. This is the new way.
          </p>
        </Reveal>

        <StaggerGroup className="mt-16 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <StaggerItem key={step.title}>
              <motion.article
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="relative h-full rounded-[2rem] border-2 border-line bg-paper p-8 shadow-[0_0.75rem_2rem_-0.75rem_#4a373026]"
              >
                {/* Step number as a peeling corner sticker. */}
                <span className="absolute -right-3 -top-3 grid size-11 place-items-center rounded-full border-2 border-ink/15 bg-cream-deep font-display text-lg font-bold text-ink-soft">
                  {i + 1}
                </span>

                <span
                  className="grid size-14 place-items-center rounded-2xl border-2"
                  style={{ boxShadow: `0.25rem 0.25rem 0 ${step.shadow}` }}
                >
                  <span className={`grid size-full place-items-center rounded-[0.85rem] ${step.tone}`}>
                    <step.icon className="size-7" strokeWidth={2.2} />
                  </span>
                </span>

                <h3 className="mt-6 font-display text-2xl font-semibold">{step.title}</h3>
                <p className="mt-3 leading-relaxed text-ink-soft">{step.body}</p>
              </motion.article>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <Squiggle className="mx-auto mt-14 w-32 text-butter" />
      </div>
    </section>
  );
}
