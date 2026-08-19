'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellRing, Check, Phone, Loader2 } from 'lucide-react';
import type { Rescue, RescueStatus } from '@aww/shared';
import { RESCUE_TRANSITIONS, RESCUE_STATUS_LABEL } from '@aww/shared';
import { api, ApiError } from '@/lib/api';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/field';

/**
 * Everything on the rescue page that depends on who is looking.
 *
 * The page itself is a server component so it renders and indexes without a
 * session; this island layers on the watch toggle, the claim button, and the
 * status controls once the browser knows who you are.
 */
export function RescueActions({ rescue }: { rescue: Rescue }) {
  const router = useRouter();
  const { user, token, loading } = useSession();

  const [watching, setWatching] = useState(Boolean(rescue.watching));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return <div className="h-14 animate-pulse rounded-2xl bg-cream-deep" />;
  }

  const myOrg = user?.organizations.find((o) => o.id === rescue.claimedBy);
  const claimable = !rescue.claimedBy && (user?.organizations.length ?? 0) > 0;
  const canDrive = Boolean(myOrg) || user?.profile.role === 'admin';
  const nextStates = canDrive ? RESCUE_TRANSITIONS[rescue.status].filter((s) => s !== 'reported') : [];

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That did not work. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleWatch() {
    if (!token) {
      router.push(`/sign-in?next=/rescues/${rescue.id}`);
      return;
    }
    const next = !watching;
    setWatching(next);
    try {
      await (next
        ? api.post(`/api/rescues/${rescue.id}/watch`, undefined, { token })
        : api.delete(`/api/rescues/${rescue.id}/watch`, { token }));
    } catch {
      setWatching(!next);
    }
  }

  return (
    <div className="space-y-4">
      <Button variant={watching ? 'sage' : 'paper'} size="lg" className="w-full" onClick={toggleWatch}>
        {watching ? <BellRing className="size-5" /> : <Bell className="size-5" />}
        {watching ? 'Following this rescue' : 'Notify me of updates'}
      </Button>

      {/* The number only reaches the page at all if the API decided this viewer
          may see it, so rendering it here is safe. */}
      {rescue.contactPhone && (
        <a
          href={`tel:${rescue.contactPhone}`}
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-sky-deep bg-sky px-6 py-3.5 font-display font-semibold text-ink shadow-[0.25rem_0.25rem_0_var(--color-sky-deep)] transition-transform hover:-translate-y-0.5"
        >
          <Phone className="size-5" />
          Call the reporter · {rescue.contactPhone}
        </a>
      )}

      {claimable && (
        <div className="rounded-2xl border-2 border-sage bg-sage-soft p-5">
          <p className="font-display font-semibold text-sage-deep">You can take this one.</p>
          <p className="mt-1 text-sm text-sage-deep/80">
            Claiming tells the reporter help is coming and hands you the contact number.
          </p>
          {user?.organizations.map((org) => (
            <Button
              key={org.id}
              variant="sage"
              className="mt-3 w-full"
              loading={busy}
              onClick={() =>
                run(() => api.post(`/api/rescues/${rescue.id}/claim`, { orgId: org.id }, { token }))
              }
            >
              <Check className="size-4" />
              Claim as {org.name}
            </Button>
          ))}
        </div>
      )}

      {canDrive && nextStates.length > 0 && (
        <div className="space-y-3 rounded-2xl border-2 border-line bg-paper p-5">
          <p className="font-display font-semibold">Post an update</p>
          <Textarea
            placeholder="Picked her up, heading to the clinic now."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
          <div className="flex flex-wrap gap-2">
            {note.trim().length >= 3 && (
              <Button
                variant="butter"
                size="sm"
                loading={busy}
                onClick={() =>
                  run(async () => {
                    await api.post(`/api/rescues/${rescue.id}/updates`, { message: note, photos: [] }, { token });
                    setNote('');
                  })
                }
              >
                Post note
              </Button>
            )}
            {nextStates.map((state: RescueStatus) => (
              <Button
                key={state}
                variant={state === 'resolved' ? 'sage' : state === 'closed' ? 'paper' : 'sky'}
                size="sm"
                loading={busy}
                onClick={() =>
                  run(async () => {
                    await api.patch(
                      `/api/rescues/${rescue.id}/status`,
                      { status: state, note: note.trim() || undefined },
                      { token },
                    );
                    setNote('');
                  })
                }
              >
                Mark {RESCUE_STATUS_LABEL[state].toLowerCase()}
              </Button>
            ))}
          </div>
        </div>
      )}

      {!user && (
        <p className="text-center text-sm text-ink-faint">
          Run a shelter?{' '}
          <a href="/sign-up?role=ngo" className="font-semibold text-blush underline underline-offset-4">
            Register it
          </a>{' '}
          to claim rescues like this one.
        </p>
      )}

      {error && <p className="text-sm font-semibold text-critical-deep">{error}</p>}
      {busy && (
        <p className="flex items-center justify-center gap-2 text-sm text-ink-faint">
          <Loader2 className="size-4 animate-spin" /> Saving…
        </p>
      )}
    </div>
  );
}
