/**
 * Hand-drawn decorations.
 *
 * Every path here is deliberately imperfect — uneven pad spacing on the paw,
 * a heart with one lobe slightly bigger, squiggles that do not repeat. Perfectly
 * symmetrical vector shapes are what make a "cute" page look machine-made, so
 * the wobble is the point.
 */

type DoodleProps = { className?: string; style?: React.CSSProperties };

export function Paw({ className, style }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} style={style} aria-hidden>
      <ellipse cx="21" cy="18" rx="7.2" ry="9" transform="rotate(-14 21 18)" />
      <ellipse cx="34.5" cy="13.5" rx="6.6" ry="8.6" transform="rotate(-4 34.5 13.5)" />
      <ellipse cx="47" cy="19.5" rx="6.4" ry="8.2" transform="rotate(13 47 19.5)" />
      <ellipse cx="54" cy="33" rx="5.8" ry="7" transform="rotate(26 54 33)" />
      {/* The main pad, drawn as a soft irregular blob rather than an ellipse. */}
      <path d="M33 27c9.5 0 17.5 6.4 17.5 14.6 0 7.6-6.4 12.4-14.2 13.6-4.4.7-6.6.7-11 0C17.5 54 11 49.2 11 41.6 11 33.4 22.6 27 33 27Z" />
    </svg>
  );
}

export function HeartDoodle({ className, style }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} style={style} aria-hidden>
      <path d="M32 55S7 40.5 7 24.2C7 15.6 13.6 9 22 9c4.9 0 8.6 2.3 10.6 5.6C34.4 11.1 38.4 9 43 9c8.4 0 15 6.6 15 15.2C58 40.2 32 55 32 55Z" />
    </svg>
  );
}

export function Squiggle({ className, style }: DoodleProps) {
  return (
    <svg viewBox="0 0 140 20" fill="none" className={className} style={style} aria-hidden>
      <path
        d="M3 12c9-9 18 6 27-1s18-8 27-1 18 7 27 0 18-6 27 1"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Sparkle({ className, style }: DoodleProps) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className} style={style} aria-hidden>
      <path d="M16 1c1.1 7.4 3.9 11.3 14 15-9.8 3.4-12.8 7.4-14 15-1.4-7.8-4.3-11.6-14-15C11.8 12.5 14.8 8.5 16 1Z" />
    </svg>
  );
}

export function Bone({ className, style }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 32" fill="currentColor" className={className} style={style} aria-hidden>
      <path d="M14 6.5c4.2 0 6.6 2.6 7 5.5h22c.5-3 2.9-5.5 7-5.5 4.4 0 8 3.4 8 7.6 0 1.6-.5 3.1-1.4 4.3.9 1.2 1.4 2.7 1.4 4.3 0 4.2-3.6 7.6-8 7.6-4.1 0-6.5-2.5-7-5.5H21c-.4 3-2.8 5.5-7 5.5-4.4 0-8-3.4-8-7.6 0-1.6.5-3.1 1.4-4.3A7.2 7.2 0 0 1 6 14.1c0-4.2 3.6-7.6 8-7.6Z" />
    </svg>
  );
}

export function Fish({ className, style }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 40" fill="currentColor" className={className} style={style} aria-hidden>
      <path d="M40 20c0 8.5-9.2 15-20 15S2 28.5 2 20 11.2 5 22 5s18 6.5 18 15Z" />
      <path d="M42 20 62 7v26L42 20Z" />
      <circle cx="14" cy="16" r="2.6" fill="#fff" />
    </svg>
  );
}

/** A single soft blob for section backgrounds. */
export function Blob({ className, style }: DoodleProps) {
  return <div className={`blob ${className ?? ''}`} style={style} aria-hidden />;
}

/**
 * The scattered background layer used behind hero sections. Positions are
 * hand-placed rather than randomised, so the composition is the same for
 * everyone and nothing ever lands on top of a heading.
 */
export function DoodleField({ className }: DoodleProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`} aria-hidden>
      <Paw className="absolute left-[6%] top-[18%] size-10 text-blush/25 -rotate-12 animate-[float_7s_ease-in-out_infinite]" />
      <Paw className="absolute right-[9%] top-[30%] size-8 text-sage/30 rotate-[22deg] animate-[float_9s_ease-in-out_infinite_1s]" />
      <Paw className="absolute left-[16%] bottom-[14%] size-7 text-lilac/25 rotate-[38deg] animate-[float_8s_ease-in-out_infinite_.5s]" />
      <HeartDoodle className="absolute right-[16%] bottom-[24%] size-9 text-blush/30 rotate-12 animate-[float_6s_ease-in-out_infinite_.3s]" />
      <Sparkle className="absolute left-[38%] top-[9%] size-6 text-butter/70 animate-[float_5.5s_ease-in-out_infinite]" />
      <Sparkle className="absolute right-[32%] top-[62%] size-5 text-butter/60 animate-[float_7.5s_ease-in-out_infinite_.8s]" />
      <Bone className="absolute left-[70%] top-[14%] size-12 text-peach/25 -rotate-[18deg] animate-[float_8.5s_ease-in-out_infinite_.2s]" />
      <Fish className="absolute left-[3%] top-[58%] size-10 text-sky/25 rotate-[8deg] animate-[float_6.5s_ease-in-out_infinite_1.2s]" />
    </div>
  );
}
