'use client';

import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { basemap } from './style';
import { createMarker, ensureMarkerStyles, type MarkerTone } from './marker';
import { cn } from '@/lib/utils';

/** A single-pin, non-interactive map for detail pages. Scroll and drag are off
 *  so it never traps the page scroll on a phone. */
export function StaticMap({
  lat,
  lng,
  tone = 'critical',
  emoji = '🐾',
  zoom = 15,
  className,
}: {
  lat: number;
  lng: number;
  tone?: MarkerTone;
  emoji?: string;
  zoom?: number;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!container.current || map.current) return;
    let cancelled = false;

    (async () => {
      const maplibre = await import('maplibre-gl');
      if (cancelled || !container.current) return;

      ensureMarkerStyles();
      const instance = new maplibre.Map({
        container: container.current,
        style: basemap('positron'),
        center: [lng, lat],
        zoom,
        interactive: false,
        attributionControl: { compact: true },
      });

      new maplibre.Marker({ element: createMarker({ tone, emoji, pulse: true }) })
        .setLngLat([lng, lat])
        .addTo(instance);

      map.current = instance;
    })();

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, [lat, lng, tone, emoji, zoom]);

  return (
    <div className={cn('relative overflow-hidden rounded-[1.75rem] border-2 border-line bg-cream-deep', className)}>
      <div ref={container} className="size-full" />
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-3 left-3 rounded-full border-2 border-line-strong bg-paper/95 px-3.5 py-2 font-display text-sm font-semibold shadow-[0.2rem_0.2rem_0_#4a373014] backdrop-blur"
      >
        Get directions
      </a>
    </div>
  );
}
