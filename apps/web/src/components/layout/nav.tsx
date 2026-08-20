'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X, Bell, LogOut, LayoutDashboard, Siren } from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { api } from '@/lib/api';
import { Paw } from '@/components/ui/doodles';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { initials } from '@aww/shared';

const LINKS = [
  { href: '/rescues', label: 'Rescues' },
  { href: '/adopt', label: 'Adopt' },
  { href: '/lost-found', label: 'Lost & found' },
  { href: '/volunteer', label: 'Volunteer' },
  { href: '/give', label: 'Give' },
  { href: '/organizations', label: 'Shelters' },
];

export function Nav() {
  const pathname = usePathname();
  const { user, loading, signOut, token } = useSession();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [condensed, setCondensed] = useState(false);
  const { scrollY } = useScroll();

  // Shrink the bar once the hero is behind us. A threshold rather than a
  // continuous transform, so it settles instead of jittering mid-scroll.
  useMotionValueEvent(scrollY, 'change', (y) => setCondensed(y > 40));

  useEffect(() => setOpen(false), [pathname]);

  // Refreshed on navigation rather than on a timer — a background poll on every
  // page for a badge is not worth the requests, and moving between pages is
  // when someone would notice a stale count anyway.
  const loadUnread = useCallback(async () => {
    if (!token) {
      setUnread(0);
      return;
    }
    try {
      const data = await api.get<{ unread: number }>('/api/notifications?limit=1', { token });
      setUnread(data.unread);
    } catch {
      /* a cold API should never break the navbar */
    }
  }, [token]);

  useEffect(() => {
    void loadUnread();
  }, [loadUnread, pathname]);

  // A fixed-position sheet over a scrollable body needs the body locked, or
  // the page scrolls underneath the open menu.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <motion.header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          condensed ? 'py-2' : 'py-4',
        )}
      >
        <nav
          className={cn(
            'mx-auto flex max-w-7xl items-center gap-3 rounded-full px-4 transition-all duration-300 sm:px-5',
            condensed
              ? 'h-14 border-2 border-line bg-paper/85 shadow-[0_0.5rem_1.5rem_-0.5rem_#4a373026] backdrop-blur-xl mx-3 sm:mx-6'
              : 'h-16 border-2 border-transparent mx-3 sm:mx-6',
          )}
        >
          <Link href="/" className="group flex shrink-0 items-center gap-2">
            <span className="relative grid size-10 place-items-center rounded-full border-2 border-blush-deep bg-blush text-white shadow-[0.2rem_0.2rem_0_var(--color-blush-deep)] transition-transform group-hover:rotate-[-8deg]">
              <Paw className="size-5" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              A.W.W.<span className="text-blush"> Helpers</span>
            </span>
          </Link>

          <ul className="mx-auto hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      'relative rounded-full px-3.5 py-2 font-display text-[0.92rem] font-semibold transition-colors',
                      active ? 'text-ink' : 'text-ink-soft hover:text-ink',
                    )}
                  >
                    {/* Shared layout id makes the pill glide between items
                        rather than fading out and back in. */}
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-butter-soft border-2 border-butter/60"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      />
                    )}
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <ButtonLink href="/rescues/new" variant="critical" size="sm" className="hidden sm:inline-flex">
              <Siren className="size-4" />
              Report
            </ButtonLink>

            {!loading &&
              (user ? (
                <div className="hidden items-center gap-2 lg:flex">
                  <Link
                    href="/dashboard/notifications"
                    className="relative grid size-10 place-items-center rounded-full border-2 border-line bg-paper text-ink-soft transition-colors hover:border-blush hover:text-blush"
                    aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
                  >
                    <Bell className="size-[18px]" />
                    {unread > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                        className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full border-2 border-paper bg-blush px-1 font-display text-[0.65rem] font-bold leading-4 text-white"
                      >
                        {unread > 9 ? '9+' : unread}
                      </motion.span>
                    )}
                  </Link>
                  <Link
                    href="/dashboard"
                    className="grid size-10 place-items-center rounded-full border-2 border-sage-deep bg-sage font-display text-sm font-bold text-white shadow-[0.2rem_0.2rem_0_var(--color-sage-deep)] transition-transform hover:-translate-y-0.5"
                    title={user.profile.fullName ?? 'Dashboard'}
                  >
                    {initials(user.profile.fullName)}
                  </Link>
                </div>
              ) : (
                <ButtonLink href="/sign-in" variant="paper" size="sm" className="hidden lg:inline-flex">
                  Sign in
                </ButtonLink>
              ))}

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="grid size-10 place-items-center rounded-full border-2 border-line bg-paper text-ink lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-cream/95 backdrop-blur-lg lg:hidden"
          >
            <motion.ul
              className="flex h-full flex-col justify-center gap-1 px-8"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } }}
            >
              {LINKS.map((link) => (
                <motion.li
                  key={link.href}
                  variants={{ hidden: { opacity: 0, x: -24 }, show: { opacity: 1, x: 0 } }}
                >
                  <Link
                    href={link.href}
                    className="block py-3 font-display text-4xl font-semibold text-ink transition-colors hover:text-blush"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
              <motion.li
                variants={{ hidden: { opacity: 0, x: -24 }, show: { opacity: 1, x: 0 } }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <ButtonLink href="/rescues/new" variant="critical" size="lg">
                  <Siren className="size-5" />
                  Report an animal
                </ButtonLink>
                {user ? (
                  <>
                    <ButtonLink href="/dashboard" variant="paper" size="lg">
                      <LayoutDashboard className="size-5" />
                      Dashboard
                    </ButtonLink>
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="inline-flex h-14 items-center gap-2 rounded-full px-6 font-display font-semibold text-ink-soft"
                    >
                      <LogOut className="size-5" />
                      Sign out
                    </button>
                  </>
                ) : (
                  <ButtonLink href="/sign-in" variant="paper" size="lg">
                    Sign in
                  </ButtonLink>
                )}
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
