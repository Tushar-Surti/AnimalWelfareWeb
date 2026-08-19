import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ShieldCheck, Users, Target } from 'lucide-react';
import type { Campaign, Paginated } from '@aww/shared';
import { formatCurrency, formatCompactINR } from '@aww/shared';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/shared/progress-bar';
import { Reveal } from '@/components/motion/reveal';
import { DoodleField, HeartDoodle } from '@/components/ui/doodles';

export const metadata: Metadata = {
  title: 'Fund a treatment',
  description: 'Give to a specific animal and see exactly where it went.',
};

export const revalidate = 120;

export default async function GivePage() {
  let campaigns: Campaign[] = [];
  try {
    const result = await api.get<Paginated<Campaign>>('/api/campaigns?limit=24', {
      next: { revalidate: 120 },
    });
    campaigns = result.items;
  } catch {
    campaigns = [];
  }

  return (
    <div>
      <section className="relative overflow-hidden px-6 pb-12 pt-32">
        <DoodleField className="opacity-60" />
        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal>
            <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold">
              A surgery costs less than <span className="underline-doodle">a night out</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-soft">
              Every campaign here belongs to a verified shelter and a specific animal. You see the
              photo, the bill, and the outcome.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        {campaigns.length === 0 ? (
          <div className="rounded-[2rem] border-2 border-dashed border-line-strong bg-paper/60 px-6 py-20 text-center">
            <HeartDoodle className="mx-auto size-16 text-blush/30" />
            <h2 className="mt-5 font-display text-2xl font-semibold">No open campaigns right now</h2>
            <p className="mx-auto mt-3 max-w-md text-ink-soft">
              Nothing needs funding at this moment, which is the best possible reason for this page to
              be empty.
            </p>
            <Link href="/adopt" className="mt-5 inline-block font-semibold text-blush underline underline-offset-4">
              Meet the animals waiting instead
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign, i) => {
              const pct = Math.round((campaign.raisedAmount / campaign.goalAmount) * 100);
              return (
                <Reveal key={campaign.id} delay={Math.min(i, 6) * 0.05}>
                  <Link
                    href={`/give/${campaign.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[2rem] border-2 border-line bg-paper transition-shadow hover:shadow-[0_1.25rem_2.5rem_-0.75rem_#4a373033]"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-cream-deep">
                      {campaign.coverUrl ? (
                        <Image
                          src={campaign.coverUrl}
                          alt={campaign.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <span className="grid size-full place-items-center text-6xl">🐾</span>
                      )}
                      {campaign.status === 'funded' && (
                        <span className="absolute left-3 top-3">
                          <Badge tone="sage">Fully funded 🎉</Badge>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      {campaign.organization && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-faint">
                          {campaign.organization.name}
                          {campaign.organization.verified && (
                            <ShieldCheck className="size-3.5 text-sage-deep" />
                          )}
                        </span>
                      )}

                      <h2 className="mt-2 font-display text-xl font-semibold group-hover:text-blush">
                        {campaign.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{campaign.summary}</p>

                      <div className="mt-auto pt-5">
                        <ProgressBar
                          value={campaign.raisedAmount}
                          goal={campaign.goalAmount}
                          tone={pct >= 100 ? 'sage' : 'butter'}
                        />
                        <div className="mt-2.5 flex items-baseline justify-between text-sm">
                          <span className="font-display font-bold">
                            {formatCompactINR(campaign.raisedAmount)}
                            <span className="ml-1 font-normal text-ink-faint">
                              of {formatCompactINR(campaign.goalAmount)}
                            </span>
                          </span>
                          <span className="font-display font-semibold text-butter-deep">{pct}%</span>
                        </div>
                        <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-ink-faint">
                          <Users className="size-3.5" />
                          {campaign.donorCount} {campaign.donorCount === 1 ? 'donor' : 'donors'}
                        </p>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
