import type { StyleSpecification } from 'maplibre-gl';

/**
 * Basemap style.
 *
 * CARTO's raster tiles are free, need no API key, and — unlike the default
 * MapLibre demo tiles — actually have street-level detail in Indian cities,
 * which matters when the whole product is "the animal is next to *that* shop".
 * `voyager` is the warmest of their three; `positron` is the quiet one, used
 * behind dense markers where the map should recede.
 */
export function basemap(variant: 'voyager' | 'positron' = 'voyager'): StyleSpecification {
  const ratio = typeof window !== 'undefined' && window.devicePixelRatio > 1 ? '@2x' : '';

  return {
    version: 8,
    sources: {
      base: {
        type: 'raster',
        tiles: ['a', 'b', 'c'].map(
          (host) => `https://${host}.basemaps.cartocdn.com/rastertiles/${variant}/{z}/{x}/{y}${ratio}.png`,
        ),
        tileSize: 256,
        maxzoom: 20,
        attribution:
          '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a> · <a href="https://carto.com/attributions">© CARTO</a>',
      },
    },
    layers: [
      // A cream wash under the tiles so the map never flashes white while
      // loading on a cream page.
      { id: 'background', type: 'background', paint: { 'background-color': '#FFF6EE' } },
      {
        id: 'base',
        type: 'raster',
        source: 'base',
        paint: {
          // Knock the saturation back so our markers stay the loudest thing on
          // screen, and let the page's cream show through very slightly.
          'raster-saturation': -0.25,
          'raster-contrast': -0.05,
          'raster-opacity': 0.92,
        },
      },
    ],
  };
}
