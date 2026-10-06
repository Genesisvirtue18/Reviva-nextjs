import { getLandingHtml } from '@/lib/content';

/* /lp/<slug>: an ad landing page, from Sanity (Ad landing pages). */
export async function GET(_req: Request, ctx: RouteContext<'/lp/[slug]'>) {
  const { slug } = await ctx.params;
  const html = await getLandingHtml(slug);
  if (!html) return new Response('Not found', { status: 404 });
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
