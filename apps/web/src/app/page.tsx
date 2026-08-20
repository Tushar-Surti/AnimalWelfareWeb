import type { Rescue, Animal, Paginated } from '@aww/shared';
import { api } from '@/lib/api';
import { Hero } from '@/components/home/hero';
import { Ticker } from '@/components/home/ticker';
import { HowItWorks } from '@/components/home/how-it-works';
import { HappeningNow } from '@/components/home/happening-now';
import { WaysToHelp } from '@/components/home/ways-to-help';
import { FinalCta } from '@/components/home/final-cta';

/** Rebuilt every five minutes. Both fetches fail soft: a cold-starting API on
 *  Render's free tier should cost us a section, never the whole page. */
export const revalidate = 300;

async function getFeatured() {
  const [rescues, animals] = await Promise.allSettled([
    api.get<Paginated<Rescue>>('/api/rescues?status=reported,claimed,in_care&limit=3', {
      next: { revalidate: 300 },
    }),
    api.get<Paginated<Animal>>('/api/animals?limit=4', { next: { revalidate: 300 } }),
  ]);

  return {
    rescues: rescues.status === 'fulfilled' ? rescues.value.items : [],
    animals: animals.status === 'fulfilled' ? animals.value.items : [],
  };
}

export default async function HomePage() {
  const { rescues, animals } = await getFeatured();

  return (
    <>
      <Hero />
      <Ticker />
      <HowItWorks />
      <HappeningNow rescues={rescues} animals={animals} />
      <WaysToHelp />
      <FinalCta />
    </>
  );
}
