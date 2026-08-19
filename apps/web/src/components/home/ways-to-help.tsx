'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Search, HandHeart, IndianRupee, Building2, ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';

const WAYS = [
  {
    href: '/adopt',
    icon: Home,
    title: 'Adopt or foster',
    body: 'Meet the ones already safe and waiting for a sofa of their own.',
    className: 'bg-blush-soft border-blush/40 lg:col-span-3 lg:row-span-2',
    accent: 'text-blush-deep',
    big: true,
  },
  {
    href: '/lost-found',
    icon: Search,
    title: 'Lost & found',
    body: 'Post a missing pet, or the one you just found on your street.',
    className: 'bg-sky-soft border-sky/40 lg:col-span-3',
    accent: 'text-sky-deep',
  },
  {
    href: '/volunteer',
    icon: HandHeart,
    title: 'Volunteer',
    body: 'Feeding rounds, transport runs, foster homes, weekend drives.',
    className: 'bg-sage-soft border-sage/40 lg:col-span-2',
    accent: 'text-sage-deep',
  },
  {
    href: '/give',
    icon: IndianRupee,
    title: 'Fund a treatment',
    body: 'Give to a specific animal and see exactly where it went.',
    className: 'bg-butter-soft border-butter/50 lg:col-span-2',
    accent: 'text-butter-deep',
  },
  {
    href: '/organizations',
    icon: Building2,
    title: 'Find a shelter',
    body: 'Verified rescuers near you, with the number that actually picks up.',
    className: 'bg-lilac-soft border-lilac/40 lg:col-span-2',
    accent: 'text-lilac-deep',
  },
];

export function WaysToHelp() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <span className="font-display text-sm font-bold uppercase tracking-[0.2em] text-blush">
            Pick your part
          </span>
          <h2 className="mt-3 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold">
            Not everyone can foster. <span className="underline-doodle">Everyone can do something.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid auto-rows-[minmax(11rem,auto)] gap-4 lg:grid-cols-6">
          {WAYS.map((way, i) => (
            <Reveal key={way.href} delay={i * 0.06} className={way.className}>
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="h-full"
              >
                <Link
                  href={way.href}
                  className="group flex h-full flex-col rounded-[2rem] border-2 p-7 transition-shadow hover:shadow-[0_1rem_2.5rem_-0.75rem_#4a373033]"
                  style={{ borderColor: 'inherit' }}
                >
                  <span className="flex items-start justify-between">
                    <way.icon className={`size-8 ${way.accent}`} strokeWidth={2.1} />
                    <ArrowUpRight
                      className={`size-6 ${way.accent} opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-100`}
                    />
                  </span>
                  <h3
                    className={`mt-auto pt-8 font-display font-semibold ${way.big ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}
                  >
                    {way.title}
                  </h3>
                  <p className="mt-2 max-w-sm text-ink-soft">{way.body}</p>
                </Link>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
