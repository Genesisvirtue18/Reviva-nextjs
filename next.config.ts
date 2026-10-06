import type { NextConfig } from 'next';

// Old PHP URLs of the landing pages served by app/lp/[slug].
const LANDING_PAGES = ['skin-care-clinic-in-noida', 'skin-clinic-in-noida'];

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },

  async redirects() {
    return [
      // Redirects edited in Sanity are applied at request time (app/[[...path]]/layout.tsx).
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
