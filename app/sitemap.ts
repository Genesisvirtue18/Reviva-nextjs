import type { MetadataRoute } from 'next';
import { getAllPaths } from '@/lib/content';

/* /sitemap.xml, built from the pages in Sanity (replaces the static file of
   the old site). */
export const revalidate = 3600;

const SITE = 'https://revivaskinandsurgery.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = (await getAllPaths()).sort();
  return paths.map((p) => ({
    url: SITE + (p === '/' ? '/' : p),
    changeFrequency: p.startsWith('/blog/') ? 'monthly' : 'weekly',
    priority: p === '/' ? 1 : p.startsWith('/blog/') ? 0.6 : 0.8,
  }));
}
