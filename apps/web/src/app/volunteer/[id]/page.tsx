import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ShieldCheck, MapPin, Clock, Users, Laptop, CalendarDays } from 'lucide-react';
import type { VolunteerOpportunity, ApplicationStatus } from '@aww/shared';
import { pluralize } from '@aww/shared';
import { api, ApiError } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { StaticMap } from '@/components/map/static-map';
import { VolunteerSignupForm } from '@/components/volunteer/signup-form';
import { HeartDoodle } from '@/components/ui/doodles';

type Detail = VolunteerOpportunity & { applicationStatus?: ApplicationStatus | null };

export const dynamic = 'force-dynamic';

async function getOpportunity(id: string): Promise<Detail | null> {
  try {
    return await api.get<Detail>(`/api/volunteers/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await getOpportunity(id).catch(() => null);
  if (!item) return { title: 'Opportunity not found' };

  return {
    title: item.title,
    description: item.description.slice(0, 155),
  };
}

function formatWindow(startsAt: string | null, endsAt: string | null): string | null {
  if (!startsAt) return null;
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return endsAt && endsAt !== startsAt ? `${fmt(startsAt)} → ${fmt(endsAt)}` : fmt(startsAt);
}

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getOpportunity(id);
  if (!item) notFound();

  const spotsLeft = Math.max(0, item.slots - item.filled);
  const window = formatWindow(item.startsAt, item.endsAt);

  return (
    <div className="px-6 pb-24 pt-28">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/volunteer"
          className="inline-flex items-center gap-2 font-display text-sm font-semibold text-ink-soft transition-colors hover:text-sage-deep"
        >
          <ArrowLeft className="size-4" />
          All opportunities
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {item.remote ? (
                <Badge tone="lilac">
                  <Laptop className="size-3" /> Remote
                </Badge>
              ) : (
                item.city && (
                  <Badge tone="sage">
                    <MapPin className="size-3" /> {item.city}
                  </Badge>
                )
              )}
              <Badge tone={spotsLeft > 0 ? 'butter' : 'neutral'}>
                <Users className="size-3" />
                {spotsLeft > 0 ? `${pluralize(spotsLeft, 'spot')} left` : 'Full'}
              </Badge>
              {item.commitment && (
                <Badge tone="sky">
                  <Clock className="size-3" /> {item.commitment}
                </Badge>
              )}
            </div>

            <h1 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold">
              {item.title}
            </h1>

            {item.organization && (
              <Link
                href={`/organizations/${item.organization.slug}`}
                className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-line bg-paper px-4 py-2.5 font-display font-semibold transition-colors hover:border-sage"
              >
                {item.organization.name}
                {item.organization.verified && <ShieldCheck className="size-4 text-sage-deep" />}
              </Link>
            )}

            <article className="mt-8 rounded-[1.75rem] border-2 border-line bg-paper p-7">
              <h2 className="font-display text-xl font-semibold">What you would be doing</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">{item.description}</p>

              {item.skills.length > 0 && (
                <div className="mt-6 border-t-2 border-line pt-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">
                    Helpful to have
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {item.skills.map((skill) => (
                      <Badge key={skill} tone="sky">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <dl className="mt-6 grid grid-cols-2 gap-4 border-t-2 border-line pt-5 text-sm sm:grid-cols-3">
                {window && (
                  <div>
                    <dt className="flex items-center gap-1.5 text-ink-faint">
                      <CalendarDays className="size-3.5" /> When
                    </dt>
                    <dd className="mt-0.5 font-display font-semibold">{window}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-ink-faint">Spots</dt>
                  <dd className="mt-0.5 font-display font-semibold">
                    {item.filled} of {item.slots} filled
                  </dd>
                </div>
                {item.address && (
                  <div>
                    <dt className="text-ink-faint">Where</dt>
                    <dd className="mt-0.5 font-display font-semibold">{item.address}</dd>
                  </div>
                )}
              </dl>
            </article>

            <p className="mt-6 flex items-start gap-2.5 rounded-2xl bg-cream-deep px-5 py-4 text-sm text-ink-soft">
              <HeartDoodle className="mt-0.5 size-4 shrink-0 text-blush" />
              Volunteering here is never paid and never obligated. Turn up, help, and stop whenever
              you need to — shelters would far rather have you occasionally than not at all.
            </p>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <VolunteerSignupForm opportunity={item} />

            {!item.remote && item.lat !== null && item.lng !== null && (
              <StaticMap lat={item.lat} lng={item.lng} tone="org" emoji="🤝" zoom={14} className="h-56" />
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
