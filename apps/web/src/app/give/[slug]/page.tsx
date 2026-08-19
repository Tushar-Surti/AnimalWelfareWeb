import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ShieldCheck, Users, CalendarDays } from 'lucide-react';
import type { Campaign } from '@aww/shared';
import { formatCurrency, formatCompactINR, timeAgo } from '@aww/shared';
import { api, ApiError } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/shared/progress-bar';
import { DonateForm } from '@/components/shared/donate-form';
import { HeartDoodle } from '@/components/ui/doodles';

export const dynamic = 'force-dynamic';

async function getCampaign(slug: string): Promise<Campaign | null> {
  try {
    return await api.get<Campaign>(`/api/campaigns/${slug}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaign(slug).catch(() => null);
  if (!campaign) return { title: 'Campaign not found' };

  return {
    title: campaign.title,
    description: campaign.summary,
    openGraph: {
      title: campaign.title,
      description: campaign.summary,
      images: campaign.coverUrl ? [{ url: campaign.coverUrl }] : undefined,
    },
  };
}

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  if (!campaign) notFound();

  const pct = Math.round((campaign.raisedAmount / campaign.goalAmount) * 100);
  const donors = campaign.recentDonors ?? [];

  return (
    <div className="px-6 pb-24 pt-28">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/give"
          className="inline-flex items-center gap-2 font-display text-sm font-semibold text-ink-soft transition-colors hover:text-butter-deep"
        >
          <ArrowLeft className="size-4" />
          All campaigns
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <div>
            <div className="relative aspect-[16/9] overflow-hidden rounded-[2.5rem] border-2 border-line bg-cream-deep">
              {campaign.coverUrl ? (
                <Image
                  src={campaign.coverUrl}
                  alt={campaign.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                />
              ) : (
                <span className="grid size-full place-items-center text-8xl">🐾</span>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {campaign.status === 'funded' && <Badge tone="sage">Fully funded 🎉</Badge>}
              {campaign.deadline && (
                <Badge tone="neutral">
                  <CalendarDays className="size-3" />
                  Closes {new Date(campaign.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Badge>
              )}
            </div>

            <h1 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold">
              {campaign.title}
            </h1>
            <p className="mt-4 text-lg text-ink-soft">{campaign.summary}</p>

            {campaign.organization && (
              <Link
                href={`/organizations/${campaign.organization.slug}`}
                className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-line bg-paper px-4 py-2.5 font-display font-semibold transition-colors hover:border-blush"
              >
                {campaign.organization.name}
                {campaign.organization.verified && <ShieldCheck className="size-4 text-sage-deep" />}
              </Link>
            )}

            <article className="mt-10 rounded-[1.75rem] border-2 border-line bg-paper p-7">
              <h2 className="font-display text-xl font-semibold">The full story</h2>
              <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-ink-soft">
                {campaign.story}
              </p>
            </article>

            {campaign.photos.length > 0 && (
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {campaign.photos.map((photo, i) => (
                  <div
                    key={photo}
                    className="relative aspect-square overflow-hidden rounded-2xl border-2 border-line bg-cream-deep"
                  >
                    <Image src={photo} alt={`Photo ${i + 1}`} fill sizes="33vw" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-[1.75rem] border-2 border-line bg-paper p-6">
              <p className="font-display text-3xl font-bold">
                {formatCompactINR(campaign.raisedAmount)}
                <span className="ml-2 text-base font-normal text-ink-faint">
                  raised of {formatCompactINR(campaign.goalAmount)}
                </span>
              </p>
              <ProgressBar
                className="mt-4"
                value={campaign.raisedAmount}
                goal={campaign.goalAmount}
                tone={pct >= 100 ? 'sage' : 'butter'}
              />
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft">
                <Users className="size-4" />
                {campaign.donorCount} {campaign.donorCount === 1 ? 'person has' : 'people have'} given
              </p>
            </div>

            <DonateForm campaign={campaign} />

            {donors.length > 0 && (
              <div className="rounded-[1.75rem] border-2 border-line bg-paper p-6">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <HeartDoodle className="size-5 text-blush" />
                  Recent gifts
                </h2>
                <ul className="mt-4 space-y-3">
                  {donors.map((donor) => (
                    <li key={donor.id} className="border-b-2 border-line pb-3 last:border-0 last:pb-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-display font-semibold">
                          {donor.anonymous || !donor.donorName ? 'Someone kind' : donor.donorName}
                        </span>
                        <span className="shrink-0 font-display font-bold text-butter-deep">
                          {formatCurrency(donor.amount, donor.currency)}
                        </span>
                      </div>
                      {donor.message && <p className="mt-1 text-sm italic text-ink-soft">“{donor.message}”</p>}
                      <p className="mt-0.5 text-xs text-ink-faint">{timeAgo(donor.createdAt)}</p>
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
