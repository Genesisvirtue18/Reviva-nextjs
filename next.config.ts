import type { NextConfig } from 'next';
import { createClient } from '@sanity/client';
import fallbackRedirects from './content/redirects.json';
import type { Redirect } from './lib/types';

/* Redirects are edited in Sanity (Redirects) and read at build time; the
   JSON snapshot of the old .htaccess is used until Sanity is connected. */
async function loadRedirects(): Promise<Redirect[]> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!projectId) return fallbackRedirects;
  const client = createClient({ projectId, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production', apiVersion: '2025-01-01', useCdn: false, perspective: 'published', token: process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN });
  const fromCms = await client.fetch<Redirect[]>(`*[_type == "redirect" && defined(source) && defined(destination)]{source, destination}`);
  return fromCms.length ? fromCms : fallbackRedirects;
}

// Old PHP URLs of the landing pages served by app/lp/[slug].
const LANDING_PAGES = ['skin-care-clinic-in-noida', 'skin-clinic-in-noida'];

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },

  // The content JSON is read from disk at runtime when Sanity isn't configured.
  outputFileTracingIncludes: {
    '/[[...path]]': ['./content/pages/**/*'],
    '/lp/[slug]': ['./public/lp/*/index.html'],
  },

  async redirects() {
    return [
      // 301s carried over from the old .htaccess (blogN.html and root-level blog URLs).
      ...(await loadRedirects()).map((r) => ({ ...r, statusCode: 301 as const })),
      ...LANDING_PAGES.map((name) => ({ source: `/lp/${name}/index.php`, destination: `/lp/${name}`, statusCode: 301 as const })),
    ];
  },

  async headers() {
    return [
      // Same caching the old .htaccess set: CSS/JS are cache-busted with ?v=.
      {
        source: '/assets/:path*.:ext(css|js)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*.:ext(webp|avif|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, must-revalidate' }],
      },
    ];
  },
};

export default nextConfig;
