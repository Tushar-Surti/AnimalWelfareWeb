import type { MetadataRoute } from 'next';

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aww-helpers.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Nothing behind these is useful to a crawler, and dashboard URLs are
      // per-user anyway.
      disallow: ['/dashboard/', '/auth/', '/api/'],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
