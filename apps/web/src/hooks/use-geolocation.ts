'use client';

import { useCallback, useEffect, useState } from 'react';

export type Coords = { lat: number; lng: number };

/** Falls back to the centre of Mumbai so a first-time visitor who declines the
 *  permission prompt still sees a populated map instead of an empty grey box. */
export const FALLBACK_CENTRE: Coords = { lat: 19.076, lng: 72.8777 };
const STORAGE_KEY = 'aww:last-location';

type State = {
  coords: Coords | null;
  status: 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable';
  error: string | null;
};

export function useGeolocation(options: { auto?: boolean } = {}) {
  const { auto = false } = options;
  const [state, setState] = useState<State>({ coords: null, status: 'idle', error: null });

  // Reuse the last known position on load so the map can render immediately
  // while the fresh fix is still being acquired.
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) setState((s) => ({ ...s, coords: JSON.parse(cached) as Coords }));
    } catch {
      /* private mode, corrupt value — not worth surfacing */
    }
  }, []);

  const locate = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState((s) => ({ ...s, status: 'unavailable', error: 'This browser cannot share a location.' }));
      return;
    }

    setState((s) => ({ ...s, status: 'locating', error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
        } catch {
          /* ignore */
        }
        setState({ coords, status: 'granted', error: null });
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? 'Location is blocked. You can still search by pincode.'
            : 'We could not pin down your location. Try searching by pincode.';
        setState((s) => ({ ...s, status: 'denied', error: message }));
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, []);

  useEffect(() => {
    if (auto) locate();
  }, [auto, locate]);

  const setManual = useCallback((coords: Coords) => {
    setState({ coords, status: 'granted', error: null });
  }, []);

  return { ...state, locate, setManual, centre: state.coords ?? FALLBACK_CENTRE };
}
