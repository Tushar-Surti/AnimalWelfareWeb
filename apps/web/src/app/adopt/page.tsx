'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, SlidersHorizontal, Search } from 'lucide-react';
import type { Animal, Paginated, Species, Sex, Size } from '@aww/shared';
import { SPECIES, SPECIES_LABEL, SPECIES_EMOJI, SEX, SIZE } from '@aww/shared';
import { api, qs } from '@/lib/api';
import { useGeolocation } from '@/hooks/use-geolocation';
import { AnimalCard } from '@/components/cards/animal-card';
import { ChipGroup, Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Reveal } from '@/components/motion/reveal';
import { DoodleField, Paw } from '@/components/ui/doodles';

const AGE_BUCKETS = [
  { value: 6, label: 'Under 6 months' },
  { value: 12, label: 'Under a year' },
  { value: 36, label: 'Under 3 years' },
  { value: 0, label: 'Any age' },
];

function AdoptBoard() {
  const { centre, status: geoStatus, locate } = useGeolocation({ auto: true });
  const params = useSearchParams();

  // Deep links from the footer and shared URLs seed the initial filter state.
  const [fosterOnly, setFosterOnly] = useState(params.get('fosterOnly') === 'true');
  const [nearMe, setNearMe] = useState(false);
  const [radiusKm, setRadiusKm] = useState(30);
  const [species, setSpecies] = useState<Species[]>(
    (params.get('species')?.split(',').filter(Boolean) as Species[]) ?? [],
  );
  const [sex, setSex] = useState<Sex[]>([]);
  const [size, setSize] = useState<Size[]>([]);
  const [maxAge, setMaxAge] = useState(0);
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<Paginated<Animal>>(
        `/api/animals${qs({
          // Distance sorting only kicks in once the reader opts into it — a
          // first-time visitor should see every animal, not an empty 30km radius.
          lat: nearMe ? centre.lat : undefined,
          lng: nearMe ? centre.lng : undefined,
          radiusKm: nearMe ? radiusKm : undefined,
          species: species.length ? species : undefined,
          sex: sex.length ? sex : undefined,
          size: size.length ? size : undefined,
          maxAgeMonths: maxAge || undefined,
          q: query || undefined,
          limit: 36,
        })}`,
      );
      const items = fosterOnly ? result.items.filter((a) => a.fosterOnly) : result.items;
      setAnimals(items);
      setTotal(fosterOnly ? items.length : result.total);
    } catch (err) {
      setError((err as Error).message);
      setAnimals([]);
    } finally {
      setLoading(false);
    }
  }, [nearMe, centre.lat, centre.lng, radiusKm, species, sex, size, maxAge, query, fosterOnly]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div>
      <section className="relative overflow-hidden px-6 pb-10 pt-32">
        <DoodleField className="opacity-60" />
        <div className="relative mx-auto max-w-7xl text-center">
          <Reveal>
            <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold">
              Someone here is <span className="underline-doodle">waiting for you</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-soft">
              Every one of them has already been through the hard part. All that is left is the sofa.
            </p>
          </Reveal>

          <Reveal delay={0.15} className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-faint" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or breed…"
                className="w-full rounded-full border-2 border-line bg-paper py-3.5 pl-12 pr-5 font-body text-ink placeholder:text-ink-faint focus:border-blush focus:outline-none"
              />
            </div>
            <Button variant="paper" onClick={() => setShowFilters((v) => !v)}>
              <SlidersHorizontal className="size-4" />
              Filters
            </Button>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        {showFilters && (
          <div className="mb-8 space-y-5 rounded-[2rem] border-2 border-line bg-paper p-6">
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setFosterOnly((v) => !v)}
                aria-pressed={fosterOnly}
                className={`rounded-full border-2 px-4 py-2 font-display text-sm font-semibold transition-colors ${
                  fosterOnly ? 'border-lilac-deep bg-lilac text-white' : 'border-line bg-paper text-ink-soft'
                }`}
              >
                🏠 Foster only
              </button>
              <button
                type="button"
                onClick={() => {
                  setNearMe((v) => !v);
                  if (geoStatus !== 'granted') locate();
                }}
                aria-pressed={nearMe}
                className={`rounded-full border-2 px-4 py-2 font-display text-sm font-semibold transition-colors ${
                  nearMe ? 'border-blush-deep bg-blush text-white' : 'border-line bg-paper text-ink-soft'
                }`}
              >
                📍 Near me
              </button>
              {nearMe && (
                <label className="flex flex-1 min-w-48 items-center gap-3 text-sm">
                  <span className="font-display font-semibold">Within</span>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="flex-1 accent-[var(--color-blush)]"
                  />
                  <Badge tone="blush">{radiusKm} km</Badge>
                </label>
              )}
            </div>

            <ChipGroup
              label="Species"
              options={SPECIES.map((s) => ({ value: s, label: SPECIES_LABEL[s], emoji: SPECIES_EMOJI[s] }))}
              value={species}
              onChange={setSpecies}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <ChipGroup
                label="Sex"
                options={SEX.filter((s) => s !== 'unknown').map((s) => ({ value: s, label: s }))}
                value={sex}
                onChange={setSex}
              />
              <ChipGroup
                label="Size"
                options={SIZE.map((s) => ({ value: s, label: s }))}
                value={size}
                onChange={setSize}
              />
            </div>

            <div>
              <span className="mb-2 block font-display text-sm font-semibold">Age</span>
              <div className="flex flex-wrap gap-2">
                {AGE_BUCKETS.map((bucket) => (
                  <button
                    key={bucket.label}
                    type="button"
                    onClick={() => setMaxAge(bucket.value)}
                    className={`rounded-full border-2 px-4 py-2 font-display text-sm font-semibold transition-colors ${
                      maxAge === bucket.value
                        ? 'border-blush-deep bg-blush text-white'
                        : 'border-line bg-paper text-ink-soft hover:border-blush'
                    }`}
                  >
                    {bucket.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <p className="mb-6 text-ink-soft">
          {loading ? 'Looking…' : `${total} friend${total === 1 ? '' : 's'} looking for a home`}
        </p>

        {error && (
          <div className="rounded-[1.75rem] border-2 border-critical bg-critical-soft p-6 text-critical-deep">
            <p className="font-display font-semibold">We could not load the adoption board.</p>
            <p className="mt-1 text-sm">{error}</p>
            <Button variant="critical" size="sm" className="mt-4" onClick={() => void load()}>
              Try again
            </Button>
          </div>
        )}

        {loading && animals.length === 0 && (
          <div className="grid place-items-center py-28">
            <Loader2 className="size-8 animate-spin text-ink-faint" />
          </div>
        )}

        {!loading && !error && animals.length === 0 && (
          <div className="rounded-[2rem] border-2 border-dashed border-line-strong bg-paper/60 px-6 py-20 text-center">
            <Paw className="mx-auto size-16 text-blush/30" />
            <h2 className="mt-5 font-display text-2xl font-semibold">Nobody matches that yet</h2>
            <p className="mx-auto mt-3 max-w-md text-ink-soft">
              Try loosening a filter, or widening the radius. New friends get listed every week.
            </p>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {animals.map((animal, i) => (
            <AnimalCard key={animal.id} animal={animal} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AdoptPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <AdoptBoard />
    </Suspense>
  );
}
