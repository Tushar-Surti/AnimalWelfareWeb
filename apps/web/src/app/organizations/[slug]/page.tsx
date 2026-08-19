import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ShieldCheck, Phone, Mail, Globe, MapPin, Siren, PawPrint } from 'lucide-react';
import type { Organization, Animal, Campaign } from '@aww/shared';
import { initials } from '@aww/shared';
import { api, ApiError } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { AnimalCard } from '@/components/cards/animal-card';
import { StaticMap } from '@/components/map/static-map';
import { ProgressBar } from '@/components/shared/progress-bar';
import { Squiggle } from '@/components/ui/doodles';

type OrgDetail = Organization & {
  stats: { animalsAvailable: number; rescuesHandled: number };
  campaigns: Campaign[];
};

export const revalidate = 60;

async function getOrg(slug: string): Promise<OrgDetail | null> {
  try {
    return await api.get<OrgDetail>(`/api/organizations/${slug}`, { next: { revalidate: 60 } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const org = await getOrg(slug).catch(() => null);
  if (!org) return { title: 'Shelter not found' };

  return {
    title: org.name,
    description: org.tagline ?? org.description?.slice(0, 155),
    openGraph: { images: org.coverUrl ? [{ url: org.coverUrl }] : undefined },
  };
}

export default async function OrganizationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await getOrg(slug);
  if (!org) notFound();

  // The org's own adoptable animals, fetched separately so the detail endpoint
  // stays small for the many callers that only need the header.
  let animals: Animal[] = [];
  try {
    const result = await api.get<{ items: Animal[] }>(`/api/animals?orgId=${org.id}&limit=8`, {
      next: { revalidate: 60 },
    });
    animals = result.items;
  } catch {
    animals = [];
  }

  return (
    <div className="pb-24">
      {/* Cover band. Falls back to a warm colour field rather than a grey box. */}
      <div className="relative h-56 overflow-hidden bg-butter-soft sm:h-72">
        {org.coverUrl ? (
          <Image src={org.coverUrl} alt="" fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div className="size-full bg-gradient-to-br from-butter-soft via-peach-soft to-blush-soft" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/20 to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <Link
          href="/organizations"
          className="-mt-44 inline-flex items-center gap-2 font-display text-sm font-semibold text-ink-soft transition-colors hover:text-blush sm:-mt-60"
        >
          <ArrowLeft className="size-4" />
          All shelters
        </Link>

        <div className="relative mt-24 flex flex-wrap items-end gap-6 sm:mt-32">
          <span className="relative size-28 shrink-0 overflow-hidden rounded-[2rem] border-4 border-paper bg-butter-soft shadow-[0_1rem_2rem_-0.5rem_#4a373033] sm:size-36">
            {org.logoUrl ? (
              <Image src={org.logoUrl} alt={org.name} fill sizes="144px" className="object-cover" />
            ) : (
              <span className="grid size-full place-items-center font-display text-4xl font-bold text-butter-deep">
                {initials(org.name)}
              </span>
            )}
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="flex flex-wrap items-center gap-2 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold">
              {org.name}
              {org.verified && <ShieldCheck className="size-7 text-sage-deep" />}
            </h1>
            {org.tagline && <p className="mt-1.5 text-lg text-ink-soft">{org.tagline}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {org.acceptsRescues && (
                <Badge tone="critical">
                  <Siren className="size-3" /> Takes rescue calls
                </Badge>
              )}
              {org.city && (
                <Badge tone="neutral">
                  <MapPin className="size-3" /> {[org.city, org.state].filter(Boolean).join(', ')}
                </Badge>
              )}
              {org.services.map((service) => (
                <Badge key={service} tone="sky">
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <div>
            {org.description && (
              <article className="rounded-[1.75rem] border-2 border-line bg-paper p-7">
                <h2 className="font-display text-xl font-semibold">About</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">{org.description}</p>
              </article>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-[1.5rem] border-2 border-sage/40 bg-sage-soft p-6 text-center">
                <p className="font-display text-4xl font-bold text-sage-deep">{org.stats.rescuesHandled}</p>
                <p className="mt-1 font-display text-sm font-semibold uppercase tracking-wide text-sage-deep/80">
                  rescues handled
                </p>
              </div>
              <div className="rounded-[1.5rem] border-2 border-blush/40 bg-blush-soft p-6 text-center">
                <p className="font-display text-4xl font-bold text-blush-deep">{org.stats.animalsAvailable}</p>
                <p className="mt-1 font-display text-sm font-semibold uppercase tracking-wide text-blush-deep/80">
                  waiting for homes
                </p>
              </div>
            </div>

            {animals.length > 0 && (
              <section className="mt-14">
                <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
                  <PawPrint className="size-6 text-blush" />
                  Looking for a home
                </h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {animals.map((animal, i) => (
                    <AnimalCard key={animal.id} animal={animal} index={i} />
                  ))}
                </div>
              </section>
            )}

            {org.campaigns.length > 0 && (
              <section className="mt-14">
                <h2 className="font-display text-2xl font-semibold">Open fundraisers</h2>
                <div className="mt-6 space-y-4">
                  {org.campaigns.map((campaign) => (
                    <Link
                      key={campaign.id}
                      href={`/give/${campaign.slug}`}
                      className="block rounded-[1.5rem] border-2 border-line bg-paper p-5 transition-colors hover:border-butter"
                    >
                      <h3 className="font-display text-lg font-semibold">{campaign.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{campaign.summary}</p>
                      <ProgressBar
                        className="mt-3"
                        value={campaign.raisedAmount}
                        goal={campaign.goalAmount}
                      />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <Squiggle className="mx-auto mt-14 w-28 text-butter" />
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="space-y-3 rounded-[1.75rem] border-2 border-line bg-paper p-6">
              <h2 className="font-display text-lg font-semibold">Get in touch</h2>

              {org.phone && (
                <a
                  href={`tel:${org.phone}`}
                  className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-sage-deep bg-sage px-5 py-3 font-display font-semibold text-white shadow-[0.25rem_0.25rem_0_var(--color-sage-deep)] transition-transform hover:-translate-y-0.5"
                >
                  <Phone className="size-5" />
                  {org.phone}
                </a>
              )}

              <a
                href={`mailto:${org.email}`}
                className="flex items-center gap-2.5 rounded-2xl border-2 border-line px-4 py-3 text-sm transition-colors hover:border-blush"
              >
                <Mail className="size-4 shrink-0 text-ink-faint" />
                <span className="truncate">{org.email}</span>
              </a>

              {org.website && (
                <a
                  href={org.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 rounded-2xl border-2 border-line px-4 py-3 text-sm transition-colors hover:border-blush"
                >
                  <Globe className="size-4 shrink-0 text-ink-faint" />
                  <span className="truncate">{org.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}

              {(org.addressLine1 || org.landmark) && (
                <p className="flex items-start gap-2.5 rounded-2xl bg-cream-deep px-4 py-3 text-sm text-ink-soft">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-ink-faint" />
                  <span>
                    {[org.addressLine1, org.addressLine2, org.landmark, org.city, org.state, org.pincode]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </p>
              )}
            </div>

            {org.lat !== null && org.lng !== null && (
              <StaticMap lat={org.lat} lng={org.lng} tone="org" emoji="🏥" zoom={14} className="h-56" />
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
