import type { PlatformStats } from '@aww/shared';
import { api } from '@/lib/api';
import { Hero } from '@/components/home/hero';
import { Ticker } from '@/components/home/ticker';
import { HowItWorks } from '@/components/home/how-it-works';
import { Impact } from '@/components/home/impact';
import { WaysToHelp } from '@/components/home/ways-to-help';
import { FinalCta } from '@/components/home/final-cta';

const EMPTY_STATS: PlatformStats = {
  rescuesTotal: 0,
  rescuesResolved: 0,
  animalsAdopted: 0,
  animalsWaiting: 0,
  organizations: 0,
  volunteers: 0,
  petsReunited: 0,
  fundsRaised: 0,
};

/** Rebuilt every five minutes. The homepage must render even when the API is
 *  cold-starting on Render's free tier, so a failed fetch falls back to zeroes
 *  rather than throwing the whole page away. */
export const revalidate = 300;

async function getStats(): Promise<PlatformStats> {
  try {
    return await api.get<PlatformStats>('/api/stats', { next: { revalidate: 300 } });
  } catch {
    return EMPTY_STATS;
  }
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <>
      <Hero />
      <Ticker />
      <HowItWorks />
      <Impact stats={stats} />
      <WaysToHelp />
      <FinalCta />
    </>
  );
}
