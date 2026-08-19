'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, MapPin, Clock, Users, Laptop, ShieldCheck } from 'lucide-react';
import type { VolunteerOpportunity, Paginated } from '@aww/shared';
import { formatDistance, pluralize } from '@aww/shared';
import { api, qs } from '@/lib/api';
import { useGeolocation } from '@/hooks/use-geolocation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/motion/reveal';
import { DoodleField, Paw, HeartDoodle } from '@/components/ui/doodles';

const PITCHES = [
  { emoji: '🚗', title: 'Transport runs', body: 'Drive an animal from the street to a clinic. An hour of your Sunday.' },
  { emoji: '🏠', title: 'Foster a while', body: 'A spare room for a few weeks, until the right family turns up.' },
  { emoji: '🍚', title: 'Feeding rounds', body: 'The same street, the same time, every evening. Consistency is the whole job.' },
  { emoji: '📸', title: 'Photos & admin', body: 'A good photo gets an animal adopted. So does a tidy spreadsheet.' },
];

export default function VolunteerPage() {
  const { centre, locate, status: geoStatus } = useGeolocation({ auto: true });
  const [radiusKm, setRadiusKm] = useState(30);
  const [items, setItems] = useState<VolunteerOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<Paginated<VolunteerOpportunity>>(
        `/api/volunteers${qs({ lat: centre.lat, lng: centre.lng, radiusKm, limit: 30 })}`,
      );
      setItems(result.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [centre.lat, centre.lng, radiusKm]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div>
      <section className="relative overflow-hidden px-6 pb-12 pt-32">
        <DoodleField className="opacity-60" />
        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal>
            <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold">
              You do not need a <span className="underline-doodle">spare room</span> to help
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-soft">
              Shelters are almost never short of love. They are short of drivers, hands, photographers,
              and people who show up on a Tuesday.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="relative mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PITCHES.map((pitch, i) => (
            <div
              key={pitch.title}
              className={`rounded-[1.75rem] border-2 border-line bg-paper p-6 ${
                // Alternating tilt so the row reads as taped-down cards.
                i % 2 === 0 ? 'tilt-1' : 'tilt-2'
              }`}
            >
              <span className="text-3xl">{pitch.emoji}</span>
              <h3 className="mt-3 font-display text-lg font-semibold">{pitch.title}</h3>
              <p className="mt-1.5 text-sm text-ink-soft">{pitch.body}</p>
            </div>
          ))}
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold">Open near you</h2>
          <label className="flex min-w-56 flex-1 items-center gap-3 text-sm sm:max-w-xs">
            <span className="font-display font-semibold">Within</span>
            <input
              type="range"
              min={5}
              max={100}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="flex-1 accent-[var(--color-sage)]"
            />
            <Badge tone="sage">{radiusKm} km</Badge>
          </label>
        </div>

        {geoStatus !== 'granted' && (
          <Button variant="paper" size="sm" className="mt-4" onClick={locate}>
            <MapPin className="size-4" />
            Use my location
          </Button>
        )}

        {loading && items.length === 0 && (
          <div className="grid place-items-center py-24">
            <Loader2 className="size-7 animate-spin text-ink-faint" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="mt-8 rounded-[2rem] border-2 border-dashed border-line-strong bg-paper/60 px-6 py-16 text-center">
            <Paw className="mx-auto size-14 text-sage/40" />
            <h3 className="mt-4 font-display text-xl font-semibold">Nothing listed here yet</h3>
            <p className="mx-auto mt-2 max-w-md text-ink-soft">
              Try a wider radius, or reach out to a shelter directly — most of them need help they have
              not gotten around to posting.
            </p>
            <Link
              href="/organizations"
              className="mt-4 inline-block font-semibold text-blush underline underline-offset-4"
            >
              Browse shelters near you
            </Link>
          </div>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {items.map((item, i) => {
            const spotsLeft = Math.max(0, item.slots - item.filled);
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i, 6) * 0.05, duration: 0.5 }}
                className="flex flex-col rounded-[2rem] border-2 border-line bg-paper p-6 transition-shadow hover:shadow-[0_1rem_2.5rem_-0.75rem_#4a373033]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {item.remote ? (
                    <Badge tone="lilac">
                      <Laptop className="size-3" /> Remote
                    </Badge>
                  ) : (
                    item.distanceKm !== undefined && (
                      <Badge tone="sage">
                        <MapPin className="size-3" /> {formatDistance(item.distanceKm)}
                      </Badge>
                    )
                  )}
                  <Badge tone={spotsLeft > 0 ? 'butter' : 'neutral'}>
                    <Users className="size-3" />
                    {spotsLeft > 0 ? `${pluralize(spotsLeft, 'spot')} left` : 'Full'}
                  </Badge>
                </div>

                <h3 className="mt-3 font-display text-xl font-semibold">{item.title}</h3>

                {item.organization && (
                  <Link
                    href={`/organizations/${item.organization.slug}`}
                    className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-blush"
                  >
                    {item.organization.name}
                    {item.organization.verified && <ShieldCheck className="size-3.5 text-sage-deep" />}
                  </Link>
                )}

                <p className="mt-3 line-clamp-3 text-ink-soft">{item.description}</p>

                {item.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.skills.slice(0, 4).map((skill) => (
                      <Badge key={skill} tone="sky">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-line pt-4 text-sm text-ink-faint">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4" />
                    {item.commitment ?? (item.startsAt ? new Date(item.startsAt).toLocaleDateString('en-IN') : 'Flexible')}
                  </span>
                  <Link
                    href={`/volunteer/${item.id}`}
                    className="font-display font-semibold text-sage-deep hover:underline"
                  >
                    Sign up →
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="mt-16 rounded-[2.5rem] border-2 border-sage-deep bg-sage px-8 py-12 text-center text-white shadow-[0.5rem_0.5rem_0_var(--color-sage-deep)]">
          <HeartDoodle className="mx-auto size-10 text-white/80" />
          <h2 className="mt-4 font-display text-3xl font-semibold">Run a shelter that needs hands?</h2>
          <p className="mx-auto mt-3 max-w-md text-white/90">
            Post what you need and who you need it from. Every volunteer here already opted in.
          </p>
          <Link
            href="/dashboard/volunteers/new"
            className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-ink/15 bg-paper px-7 py-3.5 font-display font-semibold text-ink shadow-[0.25rem_0.25rem_0_#4a373020] transition-transform hover:-translate-y-0.5"
          >
            Post an opportunity
          </Link>
        </div>
      </section>
    </div>
  );
}
