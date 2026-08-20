'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, BellOff, CheckCheck } from 'lucide-react';
import type { Notification } from '@aww/shared';
import { timeAgo } from '@aww/shared';
import { api } from '@/lib/api';
import { useSession } from '@/hooks/use-session';
import { Button, ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardShell, NeedsAuth } from '@/components/dashboard/shell';

/** A small emoji per notification kind reads faster than a row of identical
 *  bell icons when you are scanning twenty of them. */
const ICON: Record<string, string> = {
  rescue_update: '🚨',
  adoption_approved: '🎉',
  adoption_reviewing: '👀',
  adoption_rejected: '💌',
  volunteer_approved: '🤝',
  volunteer_rejected: '💌',
};

export default function NotificationsPage() {
  const { token, loading } = useSession();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    try {
      const data = await api.get<{ items: Notification[]; unread: number }>(
        '/api/notifications?limit=50',
        { token },
      );
      setItems(data.items);
      setUnread(data.unread);
    } finally {
      setBusy(false);
    }
  }, [token]);

  useEffect(() => {
    if (!loading) void load();
  }, [loading, load]);

  async function markAllRead() {
    // Optimistic — the list should go quiet the instant you click.
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
    setUnread(0);
    await api.post('/api/notifications/read', {}, { token });
  }

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loader2 className="size-8 animate-spin text-ink-faint" />
      </div>
    );
  }
  if (!token) return <NeedsAuth next="/dashboard/notifications" />;

  return (
    <DashboardShell
      title="Notifications"
      subtitle="Everything that moved while you were away."
      action={
        unread > 0 ? (
          <Button variant="paper" size="sm" onClick={() => void markAllRead()}>
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        ) : undefined
      }
    >
      {busy && items.length === 0 && (
        <div className="grid place-items-center py-20">
          <Loader2 className="size-7 animate-spin text-ink-faint" />
        </div>
      )}

      {!busy && items.length === 0 && (
        <div className="rounded-[2rem] border-2 border-dashed border-line-strong bg-paper/60 px-6 py-16 text-center">
          <BellOff className="mx-auto size-12 text-ink-faint" />
          <h2 className="mt-4 font-display text-2xl font-semibold">All quiet</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">
            Follow a rescue or apply to adopt, and updates will show up here.
          </p>
          <ButtonLink href="/rescues" className="mt-6">
            Browse rescues
          </ButtonLink>
        </div>
      )}

      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {items.map((n, i) => (
            <motion.li
              key={n.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 10) * 0.03 }}
            >
              <Link
                href={n.link ?? '/dashboard'}
                className={`flex items-start gap-4 rounded-[1.5rem] border-2 p-5 transition-colors ${
                  n.readAt ? 'border-line bg-paper hover:border-blush' : 'border-blush/50 bg-blush-soft'
                }`}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-paper text-xl">
                  {ICON[n.type] ?? '🐾'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-display font-semibold">{n.title}</span>
                    <span className="text-xs text-ink-faint">{timeAgo(n.createdAt)}</span>
                  </span>
                  {n.body && <span className="mt-1 block text-sm text-ink-soft">{n.body}</span>}
                </span>
                {!n.readAt && <Badge tone="blush">new</Badge>}
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </DashboardShell>
  );
}
