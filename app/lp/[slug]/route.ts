import fs from 'node:fs/promises';
import path from 'node:path';
import { getLandingHtml } from '@/lib/content';

/* /lp/<slug>: the landing page from Sanity, falling back to the original
   file in public/lp/<slug>/index.html (read from disk - its URL now
   redirects back here). */
export async function GET(_req: Request, ctx: RouteContext<'/lp/[slug]'>) {
  const { slug } = await ctx.params;
  let html = await getLandingHtml(slug);
  if (!html && /^[a-z0-9-]+$/i.test(slug)) {
    html = await fs.readFile(path.join(process.cwd(), 'public/lp', slug, 'index.html'), 'utf8').catch(() => null);
  }
  if (!html) return new Response('Not found', { status: 404 });
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
