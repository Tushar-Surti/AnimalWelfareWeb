'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import { Loader2, LocateFixed } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { basemap } from './style';
import { createMarker, ensureMarkerStyles, type MarkerTone } from './marker';
import { cn } from '@/lib/utils';

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  tone: MarkerTone;
  emoji?: string;
  pulse?: boolean;
};

type Props = {
  points: MapPoint[];
  centre: { lat: number; lng: number };
  /** Draws the search area as a translucent disc. */
  radiusKm?: number;
  zoom?: number;
  showMe?: boolean;
  onSelect?: (id: string) => void;
  onLocate?: () => void;
  selectedId?: string | null;
  className?: string;
  variant?: 'voyager' | 'positron';
};

/** Approximates a circle as a 64-gon in lat/lng. Good enough at city scale and
 *  far cheaper than reprojecting through a proper geodesic buffer. */
function circle(centre: { lat: number; lng: number }, radiusKm: number) {
  const points: Array<[number, number]> = [];
  const latPerKm = 1 / 110.574;
  const lngPerKm = 1 / (111.32 * Math.cos((centre.lat * Math.PI) / 180));

  for (let i = 0; i <= 64; i += 1) {
    const angle = (i / 64) * 2 * Math.PI;
    points.push([
      centre.lng + radiusKm * lngPerKm * Math.cos(angle),
      centre.lat + radiusKm * latPerKm * Math.sin(angle),
    ]);
  }
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'Polygon' as const, coordinates: [points] },
  };
}

export function MapView({
  points,
  centre,
  radiusKm,
  zoom = 12,
  showMe = true,
  onSelect,
  onLocate,
  selectedId,
  className,
  variant = 'voyager',
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef(new Map<string, Marker>());
  const meMarker = useRef<Marker | null>(null);
  const [ready, setReady] = useState(false);

  // Init once. maplibre-gl is imported lazily so it stays out of the entry
  // bundle — it is ~250KB and most visitors land on a page without a map.
  useEffect(() => {
    if (!container.current || map.current) return;
    let cancelled = false;

    (async () => {
      const maplibre = await import('maplibre-gl');
      if (cancelled || !container.current) return;

      ensureMarkerStyles();

      const instance = new maplibre.Map({
        container: container.current,
        style: basemap(variant),
        center: [centre.lng, centre.lat],
        zoom,
        attributionControl: { compact: true },
        // Tilting a 2D rescue map adds nothing and makes pins harder to compare.
        pitchWithRotate: false,
        dragRotate: false,
        touchZoomRotate: true,
      });

      instance.addControl(new maplibre.NavigationControl({ showCompass: false }), 'bottom-right');
      instance.on('load', () => {
        if (!cancelled) setReady(true);
      });

      map.current = instance;
    })();

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      markers.current.clear();
    };
    // Deliberately empty: re-running this would tear down and rebuild the map
    // on every prop change. Later effects handle updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recentre when the origin moves (geolocation resolves, user picks a pincode).
  useEffect(() => {
    if (!ready || !map.current) return;
    map.current.easeTo({ center: [centre.lng, centre.lat], duration: 900 });
  }, [ready, centre.lat, centre.lng]);

  // Radius disc.
  useEffect(() => {
    if (!ready || !map.current || radiusKm === undefined) return;
    const instance = map.current;
    const data = circle(centre, radiusKm);
    const source = instance.getSource('radius');

    if (source && 'setData' in source) {
      (source as { setData: (d: unknown) => void }).setData(data);
      return;
    }

    instance.addSource('radius', { type: 'geojson', data });
    instance.addLayer({
      id: 'radius-fill',
      type: 'fill',
      source: 'radius',
      paint: { 'fill-color': '#FF7EA0', 'fill-opacity': 0.08 },
    });
    instance.addLayer({
      id: 'radius-line',
      type: 'line',
      source: 'radius',
      paint: { 'line-color': '#FF7EA0', 'line-width': 2, 'line-dasharray': [2, 2], 'line-opacity': 0.5 },
    });
  }, [ready, radiusKm, centre.lat, centre.lng]);

  // Reconcile markers against `points` rather than clearing and rebuilding, so
  // pins that stayed put do not flicker when a filter changes.
  useEffect(() => {
    if (!ready || !map.current) return;
    let cancelled = false;

    (async () => {
      const maplibre = await import('maplibre-gl');
      if (cancelled || !map.current) return;

      const seen = new Set(points.map((p) => p.id));
      for (const [id, marker] of markers.current) {
        if (!seen.has(id)) {
          marker.remove();
          markers.current.delete(id);
        }
      }

      for (const point of points) {
        if (markers.current.has(point.id)) continue;
        const element = createMarker({ tone: point.tone, emoji: point.emoji, pulse: point.pulse });
        element.addEventListener('click', () => onSelect?.(point.id));
        const marker = new maplibre.Marker({ element })
          .setLngLat([point.lng, point.lat])
          .addTo(map.current);
        markers.current.set(point.id, marker);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, points, onSelect]);

  // "You are here".
  useEffect(() => {
    if (!ready || !map.current || !showMe) return;
    let cancelled = false;

    (async () => {
      const maplibre = await import('maplibre-gl');
      if (cancelled || !map.current) return;
      meMarker.current?.remove();
      meMarker.current = new maplibre.Marker({ element: createMarker({ tone: 'you', emoji: '📍' }) })
        .setLngLat([centre.lng, centre.lat])
        .addTo(map.current);
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, showMe, centre.lat, centre.lng]);

  // Fly to whichever card the reader just hovered or clicked in the list.
  useEffect(() => {
    if (!ready || !map.current || !selectedId) return;
    const point = points.find((p) => p.id === selectedId);
    if (point) map.current.flyTo({ center: [point.lng, point.lat], zoom: 15, duration: 800 });
  }, [ready, selectedId, points]);

  return (
    <div className={cn('relative overflow-hidden rounded-[2rem] border-2 border-line bg-cream-deep', className)}>
      <div ref={container} className="size-full" />

      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-cream-deep">
          <span className="flex items-center gap-2 font-display font-semibold text-ink-soft">
            <Loader2 className="size-5 animate-spin" />
            Unrolling the map…
          </span>
        </div>
      )}

      {onLocate && (
        <button
          type="button"
          onClick={onLocate}
          className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border-2 border-line-strong bg-paper/95 px-4 py-2.5 font-display text-sm font-semibold shadow-[0.2rem_0.2rem_0_#4a373014] backdrop-blur transition-transform hover:-translate-y-0.5"
        >
          <LocateFixed className="size-4 text-blush" />
          Use my location
        </button>
      )}
    </div>
  );
}
