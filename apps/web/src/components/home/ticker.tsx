import { Paw, HeartDoodle, Bone, Fish, Sparkle } from '@/components/ui/doodles';

const WORDS = ['rescue', 'adopt', 'foster', 'reunite', 'volunteer', 'heal', 'feed', 'love'];
const ICONS = [Paw, HeartDoodle, Bone, Fish, Sparkle];

/** Infinite marquee. Two identical copies of the track, translated -50% — the
 *  seam lands exactly where the second copy begins, so the loop is invisible. */
export function Ticker() {
  const strip = (
    <div className="flex shrink-0 items-center">
      {WORDS.map((word, i) => {
        const Icon = ICONS[i % ICONS.length]!;
        return (
          <span key={word} className="flex items-center">
            <span className="px-6 font-display text-2xl font-semibold uppercase tracking-wide sm:text-3xl">
              {word}
            </span>
            <Icon className="size-6 shrink-0 text-ink/45" />
          </span>
        );
      })}
    </div>
  );

  return (
    <div className="relative -rotate-[1.2deg] border-y-2 border-ink/10 bg-butter py-4 text-ink">
      <div className="fade-edges overflow-hidden">
        <div className="marquee-track">
          {strip}
          {strip}
        </div>
      </div>
    </div>
  );
}
