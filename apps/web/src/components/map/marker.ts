/**
 * Markers are built as DOM elements rather than symbol layers: there are never
 * more than a page's worth on screen, and DOM gives us the same border + offset
 * shadow language as the rest of the site for free.
 */

const TONE = {
  critical: { fill: '#FF6B6B', edge: '#E04848', ink: '#fff' },
  urgent: { fill: '#FFAB77', edge: '#EF8A4C', ink: '#4A3730' },
  stable: { fill: '#74C49F', edge: '#4FA47D', ink: '#fff' },
  adopt: { fill: '#FF7EA0', edge: '#E0517A', ink: '#fff' },
  lost: { fill: '#B79CE2', edge: '#9375C9', ink: '#fff' },
  found: { fill: '#7CC3E8', edge: '#4EA2CD', ink: '#4A3730' },
  org: { fill: '#FFD465', edge: '#EAB63A', ink: '#4A3730' },
  you: { fill: '#4A3730', edge: '#2E211C', ink: '#fff' },
} as const;

export type MarkerTone = keyof typeof TONE;

export function createMarker(options: { tone: MarkerTone; emoji?: string; pulse?: boolean }): HTMLElement {
  const { tone, emoji = '🐾', pulse = false } = options;
  const colours = TONE[tone];

  const el = document.createElement('div');
  el.style.cssText = 'position:relative;cursor:pointer;will-change:transform;';

  // Critical cases get a radiating halo so the eye finds them first on a
  // map that might hold thirty pins.
  if (pulse) {
    const halo = document.createElement('span');
    halo.style.cssText = `position:absolute;inset:-8px;border-radius:999px;background:${colours.fill};opacity:.35;animation:awwPulse 2s ease-out infinite;pointer-events:none;`;
    el.append(halo);
  }

  const pin = document.createElement('span');
  pin.style.cssText = `position:relative;display:grid;place-items:center;width:38px;height:38px;border-radius:999px;background:${colours.fill};color:${colours.ink};border:2.5px solid ${colours.edge};box-shadow:0 3px 0 ${colours.edge},0 6px 12px rgba(74,55,48,.28);font-size:17px;line-height:1;transition:transform .18s cubic-bezier(.34,1.56,.64,1);`;
  pin.textContent = emoji;

  el.append(pin);
  el.addEventListener('mouseenter', () => {
    pin.style.transform = 'translateY(-3px) scale(1.08)';
  });
  el.addEventListener('mouseleave', () => {
    pin.style.transform = '';
  });

  return el;
}

/** Injected once — keyframes cannot live in an inline style attribute. */
export function ensureMarkerStyles(): void {
  if (typeof document === 'undefined' || document.getElementById('aww-marker-styles')) return;
  const style = document.createElement('style');
  style.id = 'aww-marker-styles';
  style.textContent =
    '@keyframes awwPulse{0%{transform:scale(.85);opacity:.45}70%{transform:scale(1.5);opacity:0}100%{opacity:0}}';
  document.head.append(style);
}
