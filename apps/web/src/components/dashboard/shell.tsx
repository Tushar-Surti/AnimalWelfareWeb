'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, FileHeart, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/applications', label: 'Applications', icon: FileHeart },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

/** Shared header + tab bar for every dashboard screen, so the sub-pages do not
 *  each invent their own navigation. */
export function DashboardShell({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="px-6 pb-24 pt-32">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] font-semibold">{title}</h1>
            {subtitle && <p className="mt-2 text-ink-soft">{subtitle}</p>}
          </div>
          {action}
        </div>

        <nav className="mt-8 flex flex-wrap gap-1.5 border-b-2 border-line pb-3">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'relative inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm font-semibold transition-colors',
                  active ? 'text-ink' : 'text-ink-soft hover:text-ink',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="dash-tab"
                    className="absolute inset-0 -z-10 rounded-full border-2 border-butter/60 bg-butter-soft"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <tab.icon className="size-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

/** Uniform "you need to be signed in" state for dashboard sub-pages. */
export function NeedsAuth({ next }: { next: string }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-sm rounded-[2.5rem] border-2 border-line bg-paper p-10 text-center">
        <h1 className="font-display text-2xl font-semibold">Sign in to continue</h1>
        <Link
          href={`/sign-in?next=${next}`}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full border-2 border-blush-deep bg-blush font-display font-semibold text-white shadow-[0.25rem_0.25rem_0_var(--color-blush-deep)]"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
