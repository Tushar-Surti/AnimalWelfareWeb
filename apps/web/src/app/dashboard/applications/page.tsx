'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Loader2, Heart, HandHeart, X } from 'lucide-react';
import type { AdoptionApplication, ApplicationStatus } from '@aww/shared';
import { timeAgo } from '@aww/shared';
import { api } from '@/lib/api';
import { useSession } from '@/hooks/use-session';
import { Badge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { DashboardShell, NeedsAuth } from '@/components/dashboard/shell';
import { HeartDoodle } from '@/components/ui/doodles';

type VolunteerApp = {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  opportunity?: { id: string; title: string; city: string | null; startsAt: string | null } | null;
};

const TONE: Record<ApplicationStatus, 'sage' | 'sky' | 'neutral' | 'blush'> = {
  approved: 'sage',
  reviewing: 'sky',
  submitted: 'blush',
  rejected: 'neutral',
  withdrawn: 'neutral',
};

export default function ApplicationsPage() {
  const { token, loading } = useSession();
  const [adoption, setAdoption] = useState<AdoptionApplication[]>([]);
  const [volunteering, setVolunteering] = useState<VolunteerApp[]>([]);
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    try {
      const data = await api.get<{ adoption: AdoptionApplication[]; volunteering: VolunteerApp[] }>(
        '/api/applications/mine',
        { token },
      );
      setAdoption(data.adoption);
      setVolunteering(data.volunteering);
    } finally {
      setBusy(false);
    }
  }, [token]);

  useEffect(() => {
    if (!loading) void load();
  }, [loading, load]);

  async function withdraw(id: string) {
    await api.patch(`/api/applications/${id}`, { status: 'withdrawn' }, { token });
    void load();
  }

  if (loading) return <div className="grid min-h-dvh place-items-center"><Loader2 className="size-8 animate-spin text-ink-faint" /></div>;
  if (!token) return <NeedsAuth next="/dashboard/applications" />;

  const empty = adoption.length === 0 && volunteering.length === 0;

  return (
    <DashboardShell
      title="Your applications"
      subtitle="Everywhere you have put your hand up."
    >
      {busy && empty && (
        <div className="grid place-items-center py-20">
          <Loader2 className="size-7 animate-spin text-ink-faint" />
        </div>
      )}

      {!busy && empty && (
        <div className="rounded-[2rem] border-2 border-dashed border-line-strong bg-paper/60 px-6 py-16 text-center">
          <HeartDoodle className="mx-auto size-14 text-blush/30" />
          <h2 className="mt-4 font-display text-2xl font-semibold">Nothing yet</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">
            Apply to adopt someone, or sign up for a volunteer shift — they will all land here.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/adopt">Meet someone</ButtonLink>
            <ButtonLink href="/volunteer" variant="paper">Find a shift</ButtonLink>
          </div>
        </div>
      )}

      {adoption.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <Heart className="size-5 fill-blush text-blush" />
            Adoption
          </h2>
          <div className="mt-4 space-y-3">
            {adoption.map((a) => (
              <motion.div
                key={a.id}
                layout
                className="flex flex-wrap items-center gap-4 rounded-2xl border-2 border-line bg-paper p-4"
              >
                <Link href={`/adopt/${a.animalId}`} className="group flex min-w-0 flex-1 items-center gap-4">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
                    {a.animal?.photos[0] ? (
                      <Image src={a.animal.photos[0]} alt="" fill sizes="56px" className="object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center text-xl">🐾</span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-display font-semibold group-hover:text-blush">
                      {a.animal?.name ?? 'A friend'}
                    </span>
                    <span className="text-xs text-ink-faint">Applied {timeAgo(a.createdAt)}</span>
                  </span>
                </Link>

                <Badge tone={TONE[a.status]}>{a.status}</Badge>

                {(a.status === 'submitted' || a.status === 'reviewing') && (
                  <Button variant="ghost" size="sm" onClick={() => void withdraw(a.id)}>
                    <X className="size-4" />
                    Withdraw
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {volunteering.length > 0 && (
        <section className="mt-12">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <HandHeart className="size-5 text-sage-deep" />
            Volunteering
          </h2>
          <div className="mt-4 space-y-3">
            {volunteering.map((v) => (
              <div
                key={v.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border-2 border-line bg-paper p-4"
              >
                <Link
                  href={`/volunteer/${v.opportunity?.id ?? ''}`}
                  className="min-w-0 flex-1 font-display font-semibold hover:text-sage-deep"
                >
                  <span className="block truncate">{v.opportunity?.title ?? 'An opportunity'}</span>
                  <span className="text-xs font-normal text-ink-faint">
                    {v.opportunity?.city ? `${v.opportunity.city} · ` : ''}Signed up {timeAgo(v.createdAt)}
                  </span>
                </Link>
                <Badge tone={TONE[v.status]}>{v.status}</Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
