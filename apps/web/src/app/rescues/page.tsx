'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Loader2, SlidersHorizontal, Siren } from 'lucide-react';
import type { Rescue, Paginated, Species, Urgency, RescueStatus } from '@aww/shared';
import { SPECIES, SPECIES_LABEL, SPECIES_EMOJI, URGENCY } from '@aww/shared';
import { api, qs } from '@/lib/api';
import { useGeolocation } from '@/hooks/use-geolocation';
import { MapView, type MapPoint } from '@/components/map/map-view';
import { RescueCard, EmptyRescues } from '@/components/cards/rescue-card';
import { ChipGroup } from '@/components/ui/field';
import { ButtonLink, Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DoodleField } from '@/components/ui/doodles';

const STATUS_OPTIONS: Array<{ value: RescueStatus; label: string }> = [
  { value: 'reported', label: 'Needs a helper' },
  { value: 'claimed', label: 'Helper on the way' },
  { value: 'in_care', label: 'In care' },
  { value: 'resolved', label: 'Happy endings' },
];

export default function RescuesPage() {
  const { centre, locate, status: geoStatus, error: geoError } = useGeolocation({ auto: true });

  const [radiusKm, setRadiusKm] = useState(15);
  const [species, setSpecies] = useState<Species[]>([]);
  const [urgency, setUrgency] = useState<Urgency[]>([]);
  const [statuses, setStatuses] = useState<RescueStatus[]>(['reported', 'claimed', 'in_care']);
  const [showFilters, setShowFilters] = useState(false);

  const [rescues, setRescues] = useState<Rescue[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<Paginated<Rescue>>(
        `/api/rescues${qs({
          lat: centre.lat,
          lng: centre.lng,
          radiusKm,
          species: species.length ? species : undefined,
          urgency: urgency.length ? urgency : undefined,
          status: statuses.length ? statuses : undefined,
          limit: 60,
        })}`,
      );
      setRescues(result.items);
      setTotal(result.total);
    } catch (err) {
      setError((err as Error).message);
      setRescues([]);
    } finally {
      setLoading(false);
    }
  }, [centre.lat, centre.lng, radiusKm, species, urgency, statuses]);

  // Debounced: dragging the radius slider should not fire a request per pixel.
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const points = useMemo<MapPoint[]>(
    () =>
      rescues
        .filter((r) => r.lat !== null && r.lng !== null)
        .map((r) => ({
          id: r.id,
          lat: r.lat as number,
          lng: r.lng as number,
          tone: r.urgency,
          emoji: SPECIES_EMOJI[r.species],
          pulse: r.urgency === 'critical' && r.status === 'reported',
        })),
    [rescues],
  );

  return (
    <div className="relative">
      <section className="relative overflow-hidden px-6 pb-8 pt-32">
        <DoodleField className="opacity-60" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] font-semibold">
                Animals who need <span className="underline-doodle">help nearby</span>
              </h1>
              <p className="mt-3 max-w-xl text-lg text-ink-soft">
                Every pin is a real animal someone stopped for. Claim one if you can get there.
              </p>
            </div>
            <ButtonLink href="/rescues/new" variant="critical" size="lg">
              <Siren className="size-5" />
              Report one
            </ButtonLink>
          </div>

          {geoError && (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-butter/60 bg-butter-soft px-4 py-2 text-sm font-semibold text-butter-deep">
              {geoError}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-start">
          {/* List column */}
          <div className="order-2 lg:order-1">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Button variant="paper" size="sm" onClick={() => setShowFilters((v) => !v)}>
                <SlidersHorizontal className="size-4" />
                Filters
              </Button>
              <span className="text-sm text-ink-soft">
                {loading ? 'Looking…' : `${total} within ${radiusKm} km`}
              </span>
              {species.length + urgency.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSpecies([]);
                    setUrgency([]);
                  }}
                  className="text-sm font-semibold text-blush underline underline-offset-4"
                >
                  Clear
                </button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {showFilters && (
                <div className="mb-5 space-y-5 rounded-[1.5rem] border-2 border-line bg-paper p-5">
                  <div>
                    <label
                      htmlFor="radius"
                      className="mb-2 flex items-center justify-between font-display text-sm font-semibold"
                    >
                      Search radius
                      <Badge tone="blush">{radiusKm} km</Badge>
                    </label>
                    <input
                      id="radius"
                      type="range"
                      min={1}
                      max={60}
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(Number(e.target.value))}
                      className="w-full accent-[var(--color-blush)]"
                    />
                  </div>

                  <ChipGroup
                    label="Species"
                    options={SPECIES.map((s) => ({
                      value: s,
                      label: SPECIES_LABEL[s],
                      emoji: SPECIES_EMOJI[s],
                    }))}
                    value={species}
                    onChange={setSpecies}
                  />

                  <ChipGroup
                    label="Urgency"
                    options={URGENCY.map((u) => ({ value: u, label: u }))}
                    value={urgency}
                    onChange={setUrgency}
                  />

                  <ChipGroup
                    label="Status"
                    options={STATUS_OPTIONS}
                    value={statuses}
                    onChange={setStatuses}
                  />
                </div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              {loading && rescues.length === 0 && (
                <div className="grid place-items-center rounded-[1.75rem] border-2 border-dashed border-line-strong py-20">
                  <Loader2 className="size-7 animate-spin text-ink-faint" />
                </div>
              )}

              {error && (
                <div className="rounded-[1.5rem] border-2 border-critical bg-critical-soft p-5 text-critical-deep">
                  <p className="font-display font-semibold">We could not load rescues.</p>
                  <p className="mt-1 text-sm">{error}</p>
                  <Button variant="critical" size="sm" className="mt-3" onClick={() => void load()}>
                    Try again
                  </Button>
                </div>
              )}

              <AnimatePresence mode="popLayout">
                {rescues.map((rescue) => (
                  <RescueCard
                    key={rescue.id}
                    rescue={rescue}
                    onHover={setHovered}
                    active={hovered === rescue.id}
                  />
                ))}
              </AnimatePresence>

              {!loading && !error && rescues.length === 0 && <EmptyRescues radiusKm={radiusKm} />}
            </div>
          </div>

          {/* Map column — sticks while the list scrolls past it. */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-24">
            <MapView
              points={points}
              centre={centre}
              radiusKm={radiusKm}
              selectedId={hovered}
              onSelect={(id) => {
                document.getElementById(`rescue-${id}`)?.scrollIntoView({ block: 'center' });
                setHovered(id);
              }}
              onLocate={geoStatus === 'granted' ? undefined : locate}
              className="h-[26rem] lg:h-[calc(100dvh-8rem)]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
