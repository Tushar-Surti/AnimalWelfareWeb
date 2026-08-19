import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { MapPin, Clock, ShieldCheck, ArrowLeft, Eye } from 'lucide-react';
import type { Rescue } from '@aww/shared';
import {
  SPECIES_EMOJI, SPECIES_LABEL, RESCUE_STATUS_LABEL, URGENCY_LABEL, timeAgo, pluralize,
} from '@aww/shared';
import { api, ApiError } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Timeline } from '@/components/rescues/timeline';
import { RescueActions } from '@/components/rescues/actions';
import { StaticMap } from '@/components/map/static-map';

const URGENCY_TONE = { critical: 'critical', urgent: 'peach', stable: 'sage' } as const;
const STATUS_TONE = {
  reported: 'neutral', claimed: 'sky', in_care: 'lilac', resolved: 'sage', closed: 'neutral',
} as const;

// Rescue pages change as the story develops, so they are rendered fresh rather
// than cached — a stale "still needs help" on a resolved case is worse than a
// slightly slower page.
export const dynamic = 'force-dynamic';

async function getRescue(id: string): Promise<Rescue | null> {
  try {
    return await api.get<Rescue>(`/api/rescues/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const rescue = await getRescue(id).catch(() => null);
  if (!rescue) return { title: 'Rescue not found' };

  return {
    title: rescue.title,
    description: rescue.description.slice(0, 155),
    openGraph: {
      title: rescue.title,
      description: rescue.description.slice(0, 155),
      images: rescue.photos[0] ? [{ url: rescue.photos[0] }] : undefined,
    },
  };
}

export default async function RescuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rescue = await getRescue(id);
  if (!rescue) notFound();

  return (
    <div className="px-6 pb-24 pt-28">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/rescues"
          className="inline-flex items-center gap-2 font-display text-sm font-semibold text-ink-soft transition-colors hover:text-blush"
        >
          <ArrowLeft className="size-4" />
          All rescues
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={URGENCY_TONE[rescue.urgency]}>
                {SPECIES_EMOJI[rescue.species]} {URGENCY_LABEL[rescue.urgency]}
              </Badge>
              <Badge tone={STATUS_TONE[rescue.status]}>{RESCUE_STATUS_LABEL[rescue.status]}</Badge>
              <span className="font-mono text-xs text-ink-faint">{rescue.reference}</span>
            </div>

            <h1 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold">
              {rescue.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" />
                Reported {timeAgo(rescue.createdAt)}
              </span>
              {(rescue.city || rescue.address) && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {[rescue.landmark, rescue.address, rescue.city].filter(Boolean).join(' · ')}
                </span>
              )}
              {rescue.watcherCount !== undefined && rescue.watcherCount > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="size-4" />
                  {pluralize(rescue.watcherCount, 'person', 'people')} following
                </span>
              )}
            </div>

            {rescue.photos.length > 0 && (
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {rescue.photos.map((photo, i) => (
                  <div
                    key={photo}
                    className={`relative overflow-hidden rounded-[1.75rem] border-2 border-line bg-cream-deep ${
                      // First photo spans both columns — it is the one people
                      // actually look at.
                      i === 0 ? 'sm:col-span-2 aspect-[16/10]' : 'aspect-[4/3]'
                    }`}
                  >
                    <Image
                      src={photo}
                      alt={`${rescue.title} — photo ${i + 1}`}
                      fill
                      priority={i === 0}
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 rounded-[1.75rem] border-2 border-line bg-paper p-6">
              <h2 className="font-display text-lg font-semibold">What the reporter saw</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">{rescue.description}</p>

              <dl className="mt-6 grid grid-cols-2 gap-4 border-t-2 border-line pt-5 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-ink-faint">Animal</dt>
                  <dd className="mt-0.5 font-display font-semibold">
                    {SPECIES_EMOJI[rescue.species]} {SPECIES_LABEL[rescue.species]}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-faint">Reported by</dt>
                  <dd className="mt-0.5 font-display font-semibold">
                    {rescue.reporter?.fullName ?? rescue.contactName ?? 'Someone kind'}
                  </dd>
                </div>
                {rescue.pincode && (
                  <div>
                    <dt className="text-ink-faint">Pincode</dt>
                    <dd className="mt-0.5 font-display font-semibold">{rescue.pincode}</dd>
                  </div>
                )}
              </dl>
            </div>

            <h2 className="mt-12 font-display text-2xl font-semibold">How it has gone so far</h2>
            <div className="mt-5">
              <Timeline updates={rescue.updates ?? []} />
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            {rescue.lat !== null && rescue.lng !== null && (
              <StaticMap
                lat={rescue.lat}
                lng={rescue.lng}
                tone={rescue.urgency}
                emoji={SPECIES_EMOJI[rescue.species]}
                className="h-64"
              />
            )}

            {rescue.organization && (
              <div className="rounded-[1.75rem] border-2 border-sage bg-sage-soft p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-sage-deep">Handled by</p>
                <Link
                  href={`/organizations/${rescue.organization.slug}`}
                  className="mt-2 flex items-center gap-3 font-display text-lg font-semibold hover:underline"
                >
                  {rescue.organization.name}
                  {rescue.organization.verified && <ShieldCheck className="size-5 text-sage-deep" />}
                </Link>
              </div>
            )}

            <RescueActions rescue={rescue} />
          </aside>
        </div>
      </div>
    </div>
  );
}
