'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Siren, Search, MapPin } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { RevealWords } from '@/components/motion/reveal';
import { DoodleField, Sparkle, Paw } from '@/components/ui/doodles';

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    gsap.registerPlugin(ScrollTrigger);

    // Layered parallax: the further "back" an element reads, the less it moves,
    // so the hero gains depth as it scrolls away rather than sliding as a slab.
    const ctx = gsap.context(() => {
      gsap.to('[data-parallax="back"]', {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
      });
      gsap.to('[data-parallax="mid"]', {
        yPercent: 9,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
      });
      gsap.to('[data-parallax="front"]', {
        yPercent: -6,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
      });
      // The copy fades before it reaches the nav, so nothing collides with it.
      gsap.to('[data-hero-copy]', {
        opacity: 0,
        y: -40,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: '35% top', end: 'bottom top', scrub: 0.6 },
      });
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} className="relative overflow-hidden px-6 pb-24 pt-32 sm:pt-40">
      {/* Soft colour fields behind everything. */}
      <div data-parallax="back" className="pointer-events-none absolute inset-0 -z-10">
        <div className="blob absolute -left-32 top-10 size-[34rem] bg-blush-soft opacity-70 blur-2xl" />
        <div className="blob absolute -right-24 top-40 size-[30rem] bg-sky-soft opacity-60 blur-2xl" />
        <div className="blob absolute bottom-0 left-1/3 size-[26rem] bg-butter-soft opacity-60 blur-2xl" />
      </div>
      <div data-parallax="mid">
        <DoodleField />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
        <div data-hero-copy>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border-2 border-sage/50 bg-sage-soft px-4 py-2 font-display text-sm font-semibold text-sage-deep"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-sage-deep opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-sage-deep" />
            </span>
            Live in Mumbai, Pune & Bengaluru
          </motion.p>

          <h1 className="mt-6 font-display text-[clamp(2.75rem,7vw,5rem)] font-semibold leading-[1.02]">
            <RevealWords text="A home for" />
            <br />
            <span className="relative inline-block">
              <RevealWords text="every paw." delay={0.18} className="text-blush" />
              <Sparkle className="absolute -right-8 -top-3 size-7 animate-[float_4s_ease-in-out_infinite] text-butter" />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft"
          >
            Spot a stray who needs help? Report it in thirty seconds — no account, no forms to
            wrestle with. Every shelter within range gets pinged, and you get to watch the whole
            rescue happen.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.58 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <ButtonLink href="/rescues/new" variant="critical" size="lg">
              <Siren className="size-5" />
              Report an animal
            </ButtonLink>
            <ButtonLink href="/adopt" variant="paper" size="lg">
              <Search className="size-5" />
              Meet adoptable friends
            </ButtonLink>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 flex items-center gap-2 text-sm text-ink-faint"
          >
            <MapPin className="size-4" />
            Works without signing in · Your location never leaves the map
          </motion.p>
        </div>

        {/* The photo stack. Two real photos taped at angles, with a floating
            status card that hints at the product without faking a screenshot. */}
        <div data-parallax="front" className="relative mx-auto w-full max-w-md lg:max-w-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: -4 }}
            transition={{ type: 'spring', stiffness: 90, damping: 16, delay: 0.2 }}
            className="relative aspect-[4/5] w-[78%] overflow-hidden rounded-[2.5rem] border-4 border-paper bg-peach-soft shadow-[0_1.5rem_3rem_-1rem_#4a373040]"
          >
            <Image
              src="/photos/dog.jpg"
              alt="A rescued street dog resting in the sun"
              fill
              priority
              sizes="(max-width: 1024px) 78vw, 34vw"
              className="object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 12 }}
            animate={{ opacity: 1, scale: 1, rotate: 6 }}
            transition={{ type: 'spring', stiffness: 90, damping: 16, delay: 0.35 }}
            className="absolute -right-2 bottom-6 aspect-square w-[48%] overflow-hidden rounded-[2rem] border-4 border-paper bg-sky-soft shadow-[0_1.25rem_2.5rem_-0.75rem_#4a373040]"
          >
            <Image
              src="/photos/cat.png"
              alt="A rescued kitten looking at the camera"
              fill
              sizes="(max-width: 1024px) 48vw, 20vw"
              className="object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, type: 'spring', stiffness: 120, damping: 14 }}
            className="absolute -left-3 top-8 flex items-center gap-3 rounded-3xl border-2 border-line bg-paper/95 px-4 py-3 shadow-[0.35rem_0.35rem_0_#4a373014] backdrop-blur sm:-left-8"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl border-2 border-sage-deep bg-sage text-white">
              <Paw className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-sm font-bold">Bandra · 1.2 km away</span>
              <span className="block text-xs text-ink-soft">Helper on the way — 4 min ago</span>
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
