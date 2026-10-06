import type { NextConfig } from 'next';
import redirects from './content/redirects.json';

const LANDING_PAGES = ['skin-care-clinic-in-noida', 'skin-clinic-in-noida'];

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },

  // The content JSON is read from disk at runtime when Sanity isn't configured.
  outputFileTracingIncludes: {
    '/[[...path]]': ['./content/pages/**/*'],
  },

  async redirects() {
    return [
      // 301s carried over from the old .htaccess (blogN.html and root-level blog URLs).
      ...redirects.map((r) => ({ ...r, statusCode: 301 as const })),
      ...LANDING_PAGES.map((name) => ({ source: `/lp/${name}/index.php`, destination: `/lp/${name}`, statusCode: 301 as const })),
    ];
  },

  async rewrites() {
    return {
      // The old PHP landing pages (pure HTML inside) live in public/lp.
      beforeFiles: LANDING_PAGES.map((name) => ({
        source: `/lp/${name}`,
        destination: `/lp/${name}/index.html`,
      })),
      afterFiles: [],
      fallback: [],
    };
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
