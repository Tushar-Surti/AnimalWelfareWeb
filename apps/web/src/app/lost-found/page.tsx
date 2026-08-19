'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Loader2, MapPin, Clock, Plus } from 'lucide-react';
import type { LostFoundPost, Paginated, Species, PostKind } from '@aww/shared';
import { SPECIES, SPECIES_LABEL, SPECIES_EMOJI, formatDistance, timeAgo, formatCurrency } from '@aww/shared';
import { api, qs } from '@/lib/api';
import { useGeolocation } from '@/hooks/use-geolocation';
import { MapView, type MapPoint } from '@/components/map/map-view';
import { ChipGroup } from '@/components/ui/field';
import { ButtonLink, Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Reveal } from '@/components/motion/reveal';
import { DoodleField, Squiggle } from '@/components/ui/doodles';

const TABS: Array<{ value: PostKind | 'all'; label: string; emoji: string }> = [
  { value: 'all', label: 'Everything', emoji: '🐾' },
  { value: 'lost', label: 'Lost pets', emoji: '😿' },
  { value: 'found', label: 'Found pets', emoji: '🏠' },
];

export default function LostFoundPage() {
  const { centre, locate, status: geoStatus } = useGeolocation({ auto: true });

  const [kind, setKind] = useState<PostKind | 'all'>('all');
  const [species, setSpecies] = useState<Species[]>([]);
  const [radiusKm, setRadiusKm] = useState(20);
  const [posts, setPosts] = useState<LostFoundPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<Paginated<LostFoundPost>>(
        `/api/lost-found${qs({
          lat: centre.lat,
          lng: centre.lng,
          radiusKm,
          kind: kind === 'all' ? undefined : kind,
          species: species.length ? species : undefined,
          limit: 50,
        })}`,
      );
      setPosts(result.items);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [centre.lat, centre.lng, radiusKm, kind, species]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const points = useMemo<MapPoint[]>(
    () =>
      posts
        .filter((p) => p.lat !== null && p.lng !== null)
        .map((p) => ({
          id: p.id,
          lat: p.lat as number,
          lng: p.lng as number,
          tone: p.kind,
          emoji: SPECIES_EMOJI[p.species],
        })),
    [posts],
  );

  return (
    <div>
      <section className="relative overflow-hidden px-6 pb-8 pt-32">
        <DoodleField className="opacity-60" />
        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <h1 className="font-display text-[clamp(2.25rem,5.5vw,4rem)] font-semibold">
                  The <span className="underline-doodle">lost & found</span> board
                </h1>
                <p className="mt-4 max-w-xl text-lg text-ink-soft">
                  Two sides of the same story. Post the pet you lost, or the one that turned up on your
                  doorstep — we match them by species, distance and date.
                </p>
              </div>
              <ButtonLink href="/lost-found/new" variant="lilac" size="lg">
                <Plus className="size-5" />
                Post to the board
              </ButtonLink>
            </div>
          </Reveal>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setKind(tab.value)}
                aria-pressed={kind === tab.value}
                className={`relative rounded-full border-2 px-5 py-2.5 font-display font-semibold transition-colors ${
                  kind === tab.value
                    ? 'border-lilac-deep bg-lilac text-white'
                    : 'border-line bg-paper text-ink-soft hover:border-lilac'
                }`}
              >
                <span className="mr-1.5">{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div className="order-2 lg:order-1">
            <div className="mb-5 space-y-4 rounded-[1.5rem] border-2 border-line bg-paper p-5">
              <ChipGroup
                label="Species"
                options={SPECIES.map((s) => ({ value: s, label: SPECIES_LABEL[s], emoji: SPECIES_EMOJI[s] }))}
                value={species}
                onChange={setSpecies}
              />
              <label className="flex items-center gap-3 text-sm">
                <span className="font-display font-semibold">Within</span>
                <input
                  type="range"
                  min={2}
                  max={80}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="flex-1 accent-[var(--color-lilac)]"
                />
                <Badge tone="lilac">{radiusKm} km</Badge>
              </label>
            </div>

            {loading && posts.length === 0 && (
              <div className="grid place-items-center py-24">
                <Loader2 className="size-7 animate-spin text-ink-faint" />
              </div>
            )}

            {!loading && posts.length === 0 && (
              <div className="rounded-[1.75rem] border-2 border-dashed border-line-strong bg-paper/60 px-6 py-16 text-center">
                <Squiggle className="mx-auto w-24 text-lilac/50" />
                <h2 className="mt-4 font-display text-xl font-semibold">The board is empty here</h2>
                <p className="mx-auto mt-2 max-w-sm text-ink-soft">
                  Nobody nearby has posted a lost or found pet. That is a good sign.
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {posts.map((post, i) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.4 }}
                  onMouseEnter={() => setHovered(post.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`overflow-hidden rounded-[1.75rem] border-2 bg-paper transition-colors ${
                    hovered === post.id ? 'border-lilac' : 'border-line'
                  }`}
                >
                  <Link href={`/lost-found/${post.id}`} className="group block">
                    <div className="relative aspect-[4/3] overflow-hidden bg-cream-deep">
                      {post.photos[0] ? (
                        <Image
                          src={post.photos[0]}
                          alt={post.petName ?? 'Pet'}
                          fill
                          sizes="(max-width: 640px) 100vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="grid size-full place-items-center text-5xl">
                          {SPECIES_EMOJI[post.species]}
                        </span>
                      )}
                      <span className="absolute left-3 top-3">
                        <Badge tone={post.kind === 'lost' ? 'lilac' : 'sky'}>
                          {post.kind === 'lost' ? 'Missing' : 'Found'}
                        </Badge>
                      </span>
                      {post.reward && post.reward > 0 && (
                        <span className="absolute right-3 top-3">
                          <Badge tone="butter">{formatCurrency(post.reward)} reward</Badge>
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="truncate font-display text-lg font-semibold group-hover:text-lilac-deep">
                        {post.petName ?? `${SPECIES_LABEL[post.species]} — no name`}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{post.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
                        {post.distanceKm !== undefined && (
                          <span className="inline-flex items-center gap-1 font-semibold text-lilac-deep">
                            <MapPin className="size-3.5" />
                            {formatDistance(post.distanceKm)}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {post.kind === 'lost' ? 'Last seen' : 'Found'} {timeAgo(post.seenAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:sticky lg:top-24">
            <MapView
              points={points}
              centre={centre}
              radiusKm={radiusKm}
              selectedId={hovered}
              onSelect={setHovered}
              onLocate={geoStatus === 'granted' ? undefined : locate}
              className="h-[24rem] lg:h-[calc(100dvh-8rem)]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
