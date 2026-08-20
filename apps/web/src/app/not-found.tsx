import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { Paw, Squiggle, Sparkle } from '@/components/ui/doodles';

const ELSEWHERE = [
  { href: '/rescues', label: 'Rescues near you' },
  { href: '/adopt', label: 'Animals up for adoption' },
  { href: '/lost-found', label: 'Lost & found board' },
  { href: '/organizations', label: 'Shelters near you' },
];

export default function NotFound() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-6 py-32">
      <Paw className="pointer-events-none absolute -left-16 top-24 size-52 rotate-12 text-blush/[0.07]" />
      <Sparkle className="pointer-events-none absolute right-[18%] top-32 size-10 animate-[float_5s_ease-in-out_infinite] text-butter/60" />

      <div className="relative max-w-lg text-center">
        <p className="font-display text-[7rem] font-bold leading-none text-blush">404</p>
        <Squiggle className="mx-auto -mt-3 w-40 text-butter" />

        <h1 className="mt-6 font-display text-3xl font-semibold">
          This page wandered off
        </h1>
        <p className="mt-3 text-lg text-ink-soft">
          It happens to the best of us. Nothing here — but plenty of animals elsewhere on the site
          could use a minute of your time.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" size="lg">
            Take me home
          </ButtonLink>
          <ButtonLink href="/rescues/new" variant="critical" size="lg">
            Report an animal
          </ButtonLink>
        </div>

        <ul className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t-2 border-line pt-7 text-sm">
          {ELSEWHERE.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="font-semibold text-ink-soft underline decoration-wavy underline-offset-4 transition-colors hover:text-blush"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
