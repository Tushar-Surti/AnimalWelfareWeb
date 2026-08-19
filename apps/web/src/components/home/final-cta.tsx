'use client';

import { motion } from 'framer-motion';
import { Siren } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { Reveal } from '@/components/motion/reveal';
import { Paw, HeartDoodle, Sparkle, Bone } from '@/components/ui/doodles';

export function FinalCta() {
  return (
    <section className="px-6 py-24">
      <Reveal>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[3rem] border-2 border-blush-deep bg-blush px-8 py-20 text-center text-white shadow-[0.6rem_0.6rem_0_var(--color-blush-deep)]">
          {/* Decorations sit inside the card so they clip at its rounded edge. */}
          <Paw className="absolute -left-8 -top-6 size-40 rotate-[18deg] text-white/10" />
          <Bone className="absolute -right-10 top-8 size-40 -rotate-12 text-white/10" />
          <HeartDoodle className="absolute -bottom-10 left-1/4 size-36 rotate-12 text-white/10" />
          <motion.span
            animate={{ rotate: [0, 12, -8, 0], scale: [1, 1.12, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute right-[18%] top-10 inline-block"
          >
            <Sparkle className="size-8 text-butter" />
          </motion.span>

          <h2 className="relative font-display text-[clamp(2.25rem,5.5vw,4rem)] font-semibold leading-[1.05]">
            There is an animal
            <br />
            on your street right now.
          </h2>
          <p className="relative mx-auto mt-5 max-w-lg text-lg text-white/90">
            If it needs help, you are thirty seconds away from getting it some. That is the entire
            pitch.
          </p>
          <div className="relative mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/rescues/new" variant="butter" size="lg">
              <Siren className="size-5" />
              Report an animal
            </ButtonLink>
            <ButtonLink href="/organizations/new" variant="paper" size="lg">
              List your shelter
            </ButtonLink>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
