'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import { LocateFixed, Loader2, MapPin } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { basemap } from './style';
import { createMarker, ensureMarkerStyles } from './marker';
import { useGeolocation, type Coords } from '@/hooks/use-geolocation';
import { cn } from '@/lib/utils';

/**
 * Drag-a-pin location input for the report forms.
 *
 * Deliberately not a text address field: a street address is exactly what
 * someone standing over an injured dog cannot reliably type, and it is exactly
 * what a rescuer needs to be precise. So the pin is the source of truth and the
 * address line is optional colour ("next to the blue chai stall").
 */
export function LocationPicker({
  value,
  onChange,
  className,
  error,
}: {
  value: Coords | null;
  onChange: (coords: Coords) => void;
  className?: string;
  error?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const pin = useRef<Marker | null>(null);
  const [ready, setReady] = useState(false);
  const { centre, locate, status } = useGeolocation();

  // Keep the latest callback reachable from the map's event handlers without
  // re-initialising the map every time the parent re-renders.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!container.current || map.current) return;
    let cancelled = false;

    (async () => {
      const maplibre = await import('maplibre-gl');
      if (cancelled || !container.current) return;

      ensureMarkerStyles();
      const start = value ?? centre;

      const instance = new maplibre.Map({
        container: container.current,
        style: basemap('voyager'),
        center: [start.lng, start.lat],
        zoom: value ? 16 : 13,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
      });

      instance.addControl(new maplibre.NavigationControl({ showCompass: false }), 'bottom-right');

      const marker = new maplibre.Marker({
        element: createMarker({ tone: 'critical', emoji: '📍', pulse: true }),
        draggable: true,
      })
        .setLngLat([start.lng, start.lat])
        .addTo(instance);

      marker.on('dragend', () => {
        const { lat, lng } = marker.getLngLat();
        onChangeRef.current({ lat, lng });
      });

      // Tapping the map is faster than dragging on a phone.
      instance.on('click', (event) => {
        marker.setLngLat(event.lngLat);
        onChangeRef.current({ lat: event.lngLat.lat, lng: event.lngLat.lng });
      });

      instance.on('load', () => {
        if (!cancelled) setReady(true);
      });

      map.current = instance;
      pin.current = marker;
    })();

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow the value when the parent sets it (geolocation, or a reset).
  useEffect(() => {
    if (!ready || !value || !pin.current || !map.current) return;
    pin.current.setLngLat([value.lng, value.lat]);
    map.current.easeTo({ center: [value.lng, value.lat], zoom: 16, duration: 700 });
  }, [ready, value?.lat, value?.lng]);

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative h-72 overflow-hidden rounded-[1.5rem] border-2 bg-cream-deep sm:h-80',
          error ? 'border-critical' : 'border-line',
        )}
      >
        <div ref={container} className="size-full" />

        {!ready && (
          <div className="absolute inset-0 grid place-items-center bg-cream-deep">
            <Loader2 className="size-6 animate-spin text-ink-faint" />
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            locate();
            // The hook writes to `centre`; nudge the parent as soon as we have it.
            setTimeout(() => onChangeRef.current(centre), 400);
          }}
          className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border-2 border-line-strong bg-paper/95 px-3.5 py-2 font-display text-sm font-semibold shadow-[0.2rem_0.2rem_0_#4a373014] backdrop-blur"
        >
          {status === 'locating' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LocateFixed className="size-4 text-blush" />
          )}
          Use my location
        </button>
      </div>

      <p className="flex items-start gap-1.5 text-sm text-ink-soft">
        <MapPin className="mt-0.5 size-4 shrink-0 text-blush" />
        {value ? (
          <span>
            Pin dropped at{' '}
            <strong className="font-semibold text-ink">
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </strong>
            . Drag it if it is off — rescuers navigate straight to this point.
          </span>
        ) : (
          <span>Tap the map or drag the pin to mark exactly where the animal is.</span>
        )}
      </p>

      {error && <p className="text-sm font-semibold text-critical-deep">{error}</p>}
    </div>
  );
}
