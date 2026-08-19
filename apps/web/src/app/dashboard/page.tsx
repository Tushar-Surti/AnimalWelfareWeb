'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Loader2, Siren, Heart, Bell, Building2, PawPrint, Users, Check, X, Plus, LogOut,
} from 'lucide-react';
import type { Rescue, Animal, AdoptionApplication, Campaign, VolunteerOpportunity, Notification } from '@aww/shared';
import { SPECIES_EMOJI, RESCUE_STATUS_LABEL, timeAgo, initials, formatCompactINR } from '@aww/shared';
import { api } from '@/lib/api';
import { useSession } from '@/hooks/use-session';
import { Badge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { ProgressBar } from '@/components/shared/progress-bar';
import { Paw, HeartDoodle } from '@/components/ui/doodles';

type OrgDashboard = {
  activeRescues: Rescue[];
  animals: Animal[];
  pendingApplications: AdoptionApplication[];
  campaigns: Campaign[];
  opportunities: VolunteerOpportunity[];
};

type Activity = {
  reports: Rescue[];
  favourites: Animal[];
  watching: Array<Pick<Rescue, 'id' | 'reference' | 'title' | 'status' | 'urgency' | 'photos' | 'city' | 'createdAt'>>;
  adoptionApplications: AdoptionApplication[];
};

export default function DashboardPage() {
  const { user, token, loading, signOut } = useSession();
  const [org, setOrg] = useState<OrgDashboard | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [busy, setBusy] = useState(true);

  const orgId = user?.organizations[0]?.id;

  const load = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    // Fired together: an org owner sees both halves, and a plain citizen only
    // pays for the one that applies to them.
    const [orgResult, activityResult, notifResult] = await Promise.allSettled([
      orgId ? api.get<OrgDashboard>(`/api/organizations/${orgId}/dashboard`, { token }) : Promise.resolve(null),
      api.get<Activity>('/api/me/activity', { token }),
      api.get<{ items: Notification[] }>('/api/notifications?limit=8', { token }),
    ]);

    if (orgResult.status === 'fulfilled') setOrg(orgResult.value);
    if (activityResult.status === 'fulfilled') setActivity(activityResult.value);
    if (notifResult.status === 'fulfilled') setNotifications(notifResult.value.items);
    setBusy(false);
  }, [token, orgId]);

  useEffect(() => {
    if (!loading) void load();
  }, [loading, load]);

  async function decide(applicationId: string, status: 'approved' | 'rejected' | 'reviewing') {
    await api.patch(`/api/applications/${applicationId}`, { status }, { token });
    void load();
  }

  if (loading || (busy && !activity)) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loader2 className="size-8 animate-spin text-ink-faint" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-sm rounded-[2.5rem] border-2 border-line bg-paper p-10 text-center">
          <Paw className="mx-auto size-12 text-blush/40" />
          <h1 className="mt-4 font-display text-2xl font-semibold">Sign in to see your dashboard</h1>
          <ButtonLink href="/sign-in?next=/dashboard" size="lg" className="mt-6 w-full">
            Sign in
          </ButtonLink>
        </div>
      </div>
    );
  }

  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="px-6 pb-24 pt-32">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className="grid size-16 place-items-center rounded-[1.5rem] border-2 border-sage-deep bg-sage font-display text-xl font-bold text-white shadow-[0.3rem_0.3rem_0_var(--color-sage-deep)]">
              {initials(user.profile.fullName)}
            </span>
            <div>
              <h1 className="font-display text-3xl font-semibold">
                Hi {user.profile.fullName?.split(' ')[0] ?? 'there'} 👋
              </h1>
              <p className="text-ink-soft">
                {org ? user.organizations[0]?.name : 'Thanks for being one of the people who stops.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink href="/rescues/new" variant="critical" size="sm">
              <Siren className="size-4" />
              Report
            </ButtonLink>
            {!org && (
              <ButtonLink href="/organizations/new" variant="butter" size="sm">
                <Building2 className="size-4" />
                List a shelter
              </ButtonLink>
            )}
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>

        {/* Counters */}
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'reports filed', value: activity?.reports.length ?? 0, tone: 'bg-blush-soft border-blush/40 text-blush-deep' },
            { label: 'following', value: activity?.watching.length ?? 0, tone: 'bg-sky-soft border-sky/40 text-sky-deep' },
            { label: 'favourites', value: activity?.favourites.length ?? 0, tone: 'bg-peach-soft border-peach/40 text-peach-deep' },
            { label: 'applications', value: activity?.adoptionApplications.length ?? 0, tone: 'bg-sage-soft border-sage/40 text-sage-deep' },
          ].map((tile) => (
            <div key={tile.label} className={`rounded-[1.5rem] border-2 p-5 ${tile.tone}`}>
              <p className="font-display text-3xl font-bold tabular-nums">{tile.value}</p>
              <p className="mt-0.5 font-display text-xs font-semibold uppercase tracking-wide opacity-80">
                {tile.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="space-y-10">
            {/* ── Organization side ─────────────────────────────────────── */}
            {org && (
              <>
                <section>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
                      <Siren className="size-6 text-critical" />
                      Rescues you are handling
                    </h2>
                    <Link href="/rescues" className="text-sm font-semibold text-blush hover:underline">
                      Find more →
                    </Link>
                  </div>

                  {org.activeRescues.length === 0 ? (
                    <p className="mt-4 rounded-2xl border-2 border-dashed border-line-strong px-5 py-8 text-center text-ink-soft">
                      Nothing on your plate right now. Browse open reports nearby.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {org.activeRescues.map((rescue) => (
                        <Link
                          key={rescue.id}
                          href={`/rescues/${rescue.id}`}
                          className="flex items-center gap-4 rounded-2xl border-2 border-line bg-paper p-4 transition-colors hover:border-critical"
                        >
                          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-cream-deep text-2xl">
                            {SPECIES_EMOJI[rescue.species]}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-display font-semibold">{rescue.title}</span>
                            <span className="text-xs text-ink-faint">
                              {rescue.city} · {timeAgo(rescue.createdAt)}
                            </span>
                          </span>
                          <Badge tone={rescue.status === 'in_care' ? 'lilac' : 'sky'}>
                            {RESCUE_STATUS_LABEL[rescue.status]}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
                    <Users className="size-6 text-blush" />
                    Adoption applications
                    {org.pendingApplications.length > 0 && (
                      <Badge tone="blush">{org.pendingApplications.length} waiting</Badge>
                    )}
                  </h2>

                  {org.pendingApplications.length === 0 ? (
                    <p className="mt-4 rounded-2xl border-2 border-dashed border-line-strong px-5 py-8 text-center text-ink-soft">
                      No applications waiting on you.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {org.pendingApplications.map((application) => (
                        <motion.div
                          key={application.id}
                          layout
                          className="rounded-[1.5rem] border-2 border-line bg-paper p-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-display text-lg font-semibold">
                                {application.fullName}
                                <span className="ml-2 font-normal text-ink-soft">
                                  wants to adopt {application.animal?.name}
                                </span>
                              </p>
                              <p className="text-xs text-ink-faint">
                                {application.phone} · {application.email} · {timeAgo(application.createdAt)}
                              </p>
                            </div>
                            <Badge tone={application.status === 'reviewing' ? 'sky' : 'neutral'}>
                              {application.status}
                            </Badge>
                          </div>

                          {application.message && (
                            <p className="mt-3 rounded-2xl bg-cream-deep px-4 py-3 text-sm text-ink-soft">
                              “{application.message}”
                            </p>
                          )}

                          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-soft">
                            {application.homeType && <span>Home: {application.homeType.replace('_', ' ')}</span>}
                            {application.household && <span>Household: {application.household}</span>}
                            <span>Other pets: {application.hasOtherPets ? application.otherPets || 'yes' : 'none'}</span>
                          </dl>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button size="sm" variant="sage" onClick={() => void decide(application.id, 'approved')}>
                              <Check className="size-4" />
                              Approve
                            </Button>
                            {application.status === 'submitted' && (
                              <Button size="sm" variant="sky" onClick={() => void decide(application.id, 'reviewing')}>
                                Mark reviewing
                              </Button>
                            )}
                            <Button size="sm" variant="paper" onClick={() => void decide(application.id, 'rejected')}>
                              <X className="size-4" />
                              Decline
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
                      <PawPrint className="size-6 text-sage" />
                      Your animals
                    </h2>
                    <ButtonLink href="/dashboard/animals/new" variant="sage" size="sm">
                      <Plus className="size-4" />
                      Add a friend
                    </ButtonLink>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {org.animals.slice(0, 6).map((animal) => (
                      <Link
                        key={animal.id}
                        href={`/adopt/${animal.id}`}
                        className="flex items-center gap-3 rounded-2xl border-2 border-line bg-paper p-3 transition-colors hover:border-sage"
                      >
                        <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
                          {animal.photos[0] ? (
                            <Image src={animal.photos[0]} alt="" fill sizes="56px" className="object-cover" />
                          ) : (
                            <span className="grid size-full place-items-center text-xl">
                              {SPECIES_EMOJI[animal.species]}
                            </span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display font-semibold">{animal.name}</span>
                          <Badge tone={animal.status === 'available' ? 'sage' : 'neutral'}>{animal.status}</Badge>
                        </span>
                      </Link>
                    ))}
                    {org.animals.length === 0 && (
                      <p className="col-span-full rounded-2xl border-2 border-dashed border-line-strong px-5 py-8 text-center text-ink-soft">
                        No animals listed yet. Adding one takes two minutes.
                      </p>
                    )}
                  </div>
                </section>

                {org.campaigns.length > 0 && (
                  <section>
                    <h2 className="font-display text-2xl font-semibold">Your fundraisers</h2>
                    <div className="mt-4 space-y-3">
                      {org.campaigns.map((campaign) => (
                        <Link
                          key={campaign.id}
                          href={`/give/${campaign.slug}`}
                          className="block rounded-2xl border-2 border-line bg-paper p-4 transition-colors hover:border-butter"
                        >
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="truncate font-display font-semibold">{campaign.title}</span>
                            <span className="shrink-0 font-display text-sm font-bold text-butter-deep">
                              {formatCompactINR(campaign.raisedAmount)} / {formatCompactINR(campaign.goalAmount)}
                            </span>
                          </div>
                          <ProgressBar className="mt-2.5" value={campaign.raisedAmount} goal={campaign.goalAmount} />
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* ── Citizen side ──────────────────────────────────────────── */}
            {activity && activity.reports.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
                  <Siren className="size-6 text-blush" />
                  Animals you reported
                </h2>
                <div className="mt-4 space-y-3">
                  {activity.reports.map((rescue) => (
                    <Link
                      key={rescue.id}
                      href={`/rescues/${rescue.id}`}
                      className="flex items-center gap-4 rounded-2xl border-2 border-line bg-paper p-4 transition-colors hover:border-blush"
                    >
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-cream-deep text-2xl">
                        {SPECIES_EMOJI[rescue.species]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display font-semibold">{rescue.title}</span>
                        <span className="text-xs text-ink-faint">
                          {rescue.reference} · {timeAgo(rescue.createdAt)}
                        </span>
                      </span>
                      <Badge tone={rescue.status === 'resolved' ? 'sage' : rescue.status === 'reported' ? 'neutral' : 'sky'}>
                        {RESCUE_STATUS_LABEL[rescue.status]}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {activity && activity.adoptionApplications.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
                  <Heart className="size-6 text-blush" />
                  Your adoption applications
                </h2>
                <div className="mt-4 space-y-3">
                  {activity.adoptionApplications.map((application) => (
                    <div
                      key={application.id}
                      className="flex items-center gap-4 rounded-2xl border-2 border-line bg-paper p-4"
                    >
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
                        {application.animal?.photos[0] ? (
                          <Image src={application.animal.photos[0]} alt="" fill sizes="48px" className="object-cover" />
                        ) : (
                          <span className="grid size-full place-items-center text-xl">🐾</span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display font-semibold">{application.animal?.name}</span>
                        <span className="text-xs text-ink-faint">Applied {timeAgo(application.createdAt)}</span>
                      </span>
                      <Badge
                        tone={
                          application.status === 'approved'
                            ? 'sage'
                            : application.status === 'rejected'
                              ? 'neutral'
                              : 'sky'
                        }
                      >
                        {application.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activity &&
              !org &&
              activity.reports.length === 0 &&
              activity.adoptionApplications.length === 0 && (
                <div className="rounded-[2rem] border-2 border-dashed border-line-strong bg-paper/60 px-6 py-16 text-center">
                  <HeartDoodle className="mx-auto size-14 text-blush/30" />
                  <h2 className="mt-4 font-display text-2xl font-semibold">Nothing here yet</h2>
                  <p className="mx-auto mt-2 max-w-md text-ink-soft">
                    Report an animal, save a favourite, or apply to adopt — everything you do shows up here.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <ButtonLink href="/rescues/new" variant="critical">
                      Report an animal
                    </ButtonLink>
                    <ButtonLink href="/adopt" variant="paper">
                      Meet someone
                    </ButtonLink>
                  </div>
                </div>
              )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="rounded-[1.75rem] border-2 border-line bg-paper p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Bell className="size-5 text-blush" />
                Notifications
                {unread > 0 && <Badge tone="blush">{unread} new</Badge>}
              </h2>

              {notifications.length === 0 ? (
                <p className="mt-4 text-sm text-ink-soft">Nothing yet. We will ping you when something moves.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <Link
                        href={notification.link ?? '/dashboard'}
                        className={`block rounded-2xl border-2 px-4 py-3 transition-colors ${
                          notification.readAt
                            ? 'border-line bg-paper hover:border-blush'
                            : 'border-blush/40 bg-blush-soft'
                        }`}
                      >
                        <p className="font-display text-sm font-semibold">{notification.title}</p>
                        {notification.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft">{notification.body}</p>
                        )}
                        <p className="mt-1 text-[0.7rem] text-ink-faint">{timeAgo(notification.createdAt)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {unread > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={async () => {
                    await api.post('/api/notifications/read', {}, { token });
                    void load();
                  }}
                >
                  Mark all read
                </Button>
              )}
            </div>

            {activity && activity.favourites.length > 0 && (
              <div className="rounded-[1.75rem] border-2 border-line bg-paper p-6">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <Heart className="size-5 fill-blush text-blush" />
                  Saved friends
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {activity.favourites.map((animal) => (
                    <li key={animal.id}>
                      <Link
                        href={`/adopt/${animal.id}`}
                        className="flex items-center gap-3 rounded-2xl px-2 py-1.5 transition-colors hover:bg-cream-deep"
                      >
                        <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
                          {animal.photos[0] ? (
                            <Image src={animal.photos[0]} alt="" fill sizes="44px" className="object-cover" />
                          ) : (
                            <span className="grid size-full place-items-center">
                              {SPECIES_EMOJI[animal.species]}
                            </span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-display font-semibold">{animal.name}</span>
                          <span className="text-xs text-ink-faint">{animal.organization?.name}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
