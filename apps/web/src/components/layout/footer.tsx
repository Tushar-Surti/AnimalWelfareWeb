import Link from 'next/link';
import { Paw, HeartDoodle, Squiggle } from '@/components/ui/doodles';

const COLUMNS = [
  {
    title: 'Help an animal',
    links: [
      { href: '/rescues/new', label: 'Report a rescue' },
      { href: '/rescues', label: 'Rescues near me' },
      { href: '/lost-found', label: 'Lost & found board' },
      { href: '/volunteer', label: 'Volunteer' },
    ],
  },
  {
    title: 'Find a friend',
    links: [
      { href: '/adopt', label: 'Adopt' },
      { href: '/adopt?fosterOnly=true', label: 'Foster' },
      { href: '/organizations', label: 'Shelters & NGOs' },
      { href: '/give', label: 'Fundraisers' },
    ],
  },
  {
    title: 'For organizations',
    links: [
      { href: '/organizations/new', label: 'List your shelter' },
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/sign-up?role=ngo', label: 'Create an NGO account' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t-2 border-line bg-cream-deep">
      <Squiggle className="absolute -top-2 left-1/2 w-40 -translate-x-1/2 text-butter" />

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="grid size-11 place-items-center rounded-full border-2 border-blush-deep bg-blush text-white shadow-[0.2rem_0.2rem_0_var(--color-blush-deep)]">
                <Paw className="size-6" />
              </span>
              <span className="font-display text-xl font-semibold">
                A.W.W.<span className="text-blush"> Helpers</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-ink-soft">
              A street-level network for animals who cannot ask for help themselves. Spot one, report
              it, and the nearest shelter hears about it in seconds.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-line-strong bg-paper px-4 py-2 text-sm font-semibold">
              <HeartDoodle className="size-4 text-blush" />
              Built in India, for Indian streets
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink-faint">
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-ink-soft transition-colors hover:text-blush hover:underline decoration-wavy underline-offset-4"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t-2 border-line-strong pt-8 text-sm text-ink-soft sm:flex-row">
          <p>© {new Date().getFullYear()} A.W.W. Helpers</p>
          <p className="inline-flex items-center gap-1.5">
            Made with <HeartDoodle className="size-4 text-blush" /> by Tushar Surti
          </p>
        </div>
      </div>
    </footer>
  );
}
