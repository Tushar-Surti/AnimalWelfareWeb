'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Loader2, Search, ShieldCheck, Phone, MapPin, Siren } from 'lucide-react';
import type { Organization, Paginated } from '@aww/shared';
import { formatDistance, initials } from '@aww/shared';
import { api, qs } from '@/lib/api';
import { useGeolocation } from '@/hooks/use-geolocation';
import { MapView, type MapPoint } from '@/components/map/map-view';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Reveal } from '@/components/motion/reveal';
import { DoodleField } from '@/components/ui/doodles';

export default function OrganizationsPage() {
  const { centre, locate, status: geoStatus } = useGeolocation({ auto: true });

  const [nearMe, setNearMe] = useState(true);
  const [radiusKm, setRadiusKm] = useState(30);
  const [query, setQuery] = useState('');
  const [rescuersOnly, setRescuersOnly] = useState(false);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<Paginated<Organization>>(
        `/api/organizations${qs({
          lat: nearMe ? centre.lat : undefined,
          lng: nearMe ? centre.lng : undefined,
          radiusKm: nearMe ? radiusKm : undefined,
          acceptsRescues: rescuersOnly ? true : undefined,
          q: query || undefined,
          limit: 40,
        })}`,
      );
      setOrgs(result.items);
    } catch {
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  }, [nearMe, centre.lat, centre.lng, radiusKm, rescuersOnly, query]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const points = useMemo<MapPoint[]>(
    () =>
      orgs
        .filter((o) => o.lat !== null && o.lng !== null)
        .map((o) => ({ id: o.id, lat: o.lat as number, lng: o.lng as number, tone: 'org' as const, emoji: '🏥' })),
    [orgs],
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
                  Shelters who <span className="underline-doodle">actually pick up</span>
                </h1>
                <p className="mt-4 max-w-xl text-lg text-ink-soft">
                  Verified rescuers, clinics and NGOs near you — with the number that reaches a human.
                </p>
              </div>
              <ButtonLink href="/organizations/new" variant="butter" size="lg">
                List your shelter
              </ButtonLink>
            </div>
          </Reveal>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="relative min-w-64 flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-faint" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name…"
                className="w-full rounded-full border-2 border-line bg-paper py-3 pl-12 pr-5 font-body focus:border-blush focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setNearMe((v) => !v);
                if (geoStatus !== 'granted') locate();
              }}
              aria-pressed={nearMe}
              className={`rounded-full border-2 px-4 py-2.5 font-display text-sm font-semibold transition-colors ${
                nearMe ? 'border-blush-deep bg-blush text-white' : 'border-line bg-paper text-ink-soft'
              }`}
            >
              📍 Near me
            </button>
            <button
              type="button"
              onClick={() => setRescuersOnly((v) => !v)}
              aria-pressed={rescuersOnly}
              className={`rounded-full border-2 px-4 py-2.5 font-display text-sm font-semibold transition-colors ${
                rescuersOnly ? 'border-critical-deep bg-critical text-white' : 'border-line bg-paper text-ink-soft'
              }`}
            >
              <Siren className="mr-1.5 inline size-4" />
              Takes rescue calls
            </button>
            {nearMe && (
              <label className="flex min-w-48 items-center gap-3 text-sm">
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
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          <div className="order-2 space-y-4 lg:order-1">
            {loading && orgs.length === 0 && (
              <div className="grid place-items-center py-24">
                <Loader2 className="size-7 animate-spin text-ink-faint" />
              </div>
            )}

            {!loading && orgs.length === 0 && (
              <div className="rounded-[1.75rem] border-2 border-dashed border-line-strong bg-paper/60 px-6 py-16 text-center">
                <h2 className="font-display text-xl font-semibold">No shelters listed here yet</h2>
                <p className="mx-auto mt-2 max-w-sm text-ink-soft">
                  Widen the radius, or if you run one — be the first in your city.
                </p>
                <Link
                  href="/organizations/new"
                  className="mt-4 inline-block font-semibold text-blush underline underline-offset-4"
                >
                  List your shelter
                </Link>
              </div>
            )}

            {orgs.map((org, i) => (
              <motion.article
                key={org.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.4 }}
                onMouseEnter={() => setHovered(org.id)}
                onMouseLeave={() => setHovered(null)}
                className={`rounded-[1.75rem] border-2 bg-paper p-5 transition-colors ${
                  hovered === org.id ? 'border-butter' : 'border-line'
                }`}
              >
                <Link href={`/organizations/${org.slug}`} className="group flex gap-4">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl border-2 border-line bg-butter-soft">
                    {org.logoUrl ? (
                      <Image src={org.logoUrl} alt="" fill sizes="64px" className="object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center font-display text-xl font-bold text-butter-deep">
                        {initials(org.name)}
                      </span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h2 className="flex items-center gap-1.5 truncate font-display text-lg font-semibold group-hover:text-blush">
                      {org.name}
                      {org.verified && <ShieldCheck className="size-4 shrink-0 text-sage-deep" />}
                    </h2>
                    {org.tagline && <p className="mt-0.5 line-clamp-1 text-sm text-ink-soft">{org.tagline}</p>}

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
                      {org.distanceKm !== undefined && (
                        <span className="inline-flex items-center gap-1 font-semibold text-blush">
                          <MapPin className="size-3.5" />
                          {formatDistance(org.distanceKm)}
                        </span>
                      )}
                      {org.city && <span>{org.city}</span>}
                      {org.acceptsRescues && <Badge tone="critical">Takes rescue calls</Badge>}
                    </div>

                    {org.services.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {org.services.slice(0, 3).map((service) => (
                          <Badge key={service} tone="sky">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>

                {org.phone && (
                  <a
                    href={`tel:${org.phone}`}
                    className="mt-4 flex items-center justify-center gap-2 rounded-full border-2 border-sage-deep bg-sage px-5 py-2.5 font-display text-sm font-semibold text-white shadow-[0.2rem_0.2rem_0_var(--color-sage-deep)] transition-transform hover:-translate-y-0.5"
                  >
                    <Phone className="size-4" />
                    {org.phone}
                  </a>
                )}
              </motion.article>
            ))}
          </div>

          <div className="order-1 lg:order-2 lg:sticky lg:top-24">
            <MapView
              points={points}
              centre={centre}
              radiusKm={nearMe ? radiusKm : undefined}
              selectedId={hovered}
              onSelect={setHovered}
              variant="positron"
              onLocate={geoStatus === 'granted' ? undefined : locate}
              className="h-[24rem] lg:h-[calc(100dvh-8rem)]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
