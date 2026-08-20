import type { MetadataRoute } from 'next';
import type { Rescue, Animal, Organization, Campaign, LostFoundPost, Paginated } from '@aww/shared';
import { api } from '@/lib/api';

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aww-helpers.vercel.app';

/** Regenerated hourly — new rescues and listings should be findable the same
 *  day, but this does not need to be live. */
export const revalidate = 3600;

const STATIC: Array<[string, MetadataRoute.Sitemap[number]['changeFrequency'], number]> = [
  ['', 'daily', 1],
  ['/rescues', 'hourly', 0.9],
  ['/rescues/new', 'monthly', 0.9],
  ['/adopt', 'daily', 0.9],
  ['/lost-found', 'hourly', 0.8],
  ['/lost-found/new', 'monthly', 0.7],
  ['/volunteer', 'daily', 0.7],
  ['/give', 'daily', 0.7],
  ['/organizations', 'weekly', 0.7],
  ['/organizations/new', 'monthly', 0.6],
  ['/sign-in', 'yearly', 0.3],
  ['/sign-up', 'yearly', 0.4],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC.map(([path, changeFrequency, priority]) => ({
    url: `${site}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  // A cold API must not break the sitemap — fall back to the static routes.
  const [rescues, animals, orgs, campaigns, board] = await Promise.allSettled([
    api.get<Paginated<Rescue>>('/api/rescues?limit=100', { next: { revalidate: 3600 } }),
    api.get<Paginated<Animal>>('/api/animals?limit=100', { next: { revalidate: 3600 } }),
    api.get<Paginated<Organization>>('/api/organizations?limit=100', { next: { revalidate: 3600 } }),
    api.get<Paginated<Campaign>>('/api/campaigns?limit=100', { next: { revalidate: 3600 } }),
    api.get<Paginated<LostFoundPost>>('/api/lost-found?limit=100', { next: { revalidate: 3600 } }),
  ]);

  if (rescues.status === 'fulfilled') {
    for (const r of rescues.value.items) {
      entries.push({
        url: `${site}/rescues/${r.id}`,
        lastModified: new Date(r.updatedAt ?? r.createdAt),
        changeFrequency: 'daily',
        priority: r.status === 'reported' ? 0.9 : 0.5,
      });
    }
  }
  if (animals.status === 'fulfilled') {
    for (const a of animals.value.items) {
      entries.push({
        url: `${site}/adopt/${a.id}`,
        lastModified: new Date(a.createdAt),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }
  if (orgs.status === 'fulfilled') {
    for (const o of orgs.value.items) {
      entries.push({ url: `${site}/organizations/${o.slug}`, changeFrequency: 'weekly', priority: 0.6 });
    }
  }
  if (campaigns.status === 'fulfilled') {
    for (const c of campaigns.value.items) {
      entries.push({ url: `${site}/give/${c.slug}`, changeFrequency: 'daily', priority: 0.6 });
    }
  }
  if (board.status === 'fulfilled') {
    for (const p of board.value.items) {
      entries.push({
        url: `${site}/lost-found/${p.id}`,
        lastModified: new Date(p.createdAt),
        changeFrequency: 'daily',
        priority: 0.7,
      });
    }
  }

  return entries;
}
