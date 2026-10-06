import { NextResponse, type NextRequest } from 'next/server';

/* Old static-site addresses -> clean Next.js routes, permanently (301), so
   bookmarks, ads and Google results keep working:
   /about.html -> /about, /Fire-and-ice-facial.html -> /fire-and-ice-facial,
   /index.html -> /, /lp/x/index.html -> /lp/x. Specific old URLs
   (blog1.html…) are handled first by the redirects in next.config.ts. */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const clean = pathname.replace(/\/index\.html$/i, '').replace(/\.html$/i, '').toLowerCase() || '/';
  const url = req.nextUrl.clone();
  url.pathname = clean;
  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: ['/((?!_next/|api/|studio|assets/).*\\.html)'],
};
