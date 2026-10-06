import 'server-only';
import { cache } from 'react';
import { defineQuery } from 'next-sanity';
import { client } from './sanity';
import { renderFields } from './render-fields';
import type { DocMeta, Page, PageSection, SiteSettings } from './types';
import type { Post, PostCard } from '@/components/blog';

/* All content comes from Sanity (there is no offline copy), read fresh on
   every request: whatever is published shows on the next page load - no
   cache, no webhook. */

const FETCH_OPTS = { cache: 'no-store' as const };

const META = `_id, title, metaDescription, noindex, shareImage, bodyClass`;
const PAGE_QUERY = defineQuery(`*[_type == "page" && path == $path][0]{
  ${META}, path, name, blocks, whatsapp }`);
const POST_FIELDS = `title, "path": "/blog/" + slug.current, publishedAt, readMinutes, excerpt, cover`;
const POST_QUERY = defineQuery(`*[_type == "post" && slug.current == $slug][0]{
  ${META}, ${POST_FIELDS}, author, body, design, seoTitle }`);
const CARDS_QUERY = defineQuery(`*[_type == "post" && defined(slug.current) && defined(publishedAt)] | order(publishedAt desc, _createdAt desc){ ${POST_FIELDS} }`);
const PATHS_QUERY = defineQuery(`[...*[_type == "page" && defined(path)].path, ...*[_type == "post" && defined(slug.current)]{"p": "/blog/" + slug.current}.p]`);
const REDIRECT_QUERY = defineQuery(`*[_type == "redirect" && source in $paths][0].destination`);
const SETTINGS_QUERY = defineQuery(`*[_type == "siteSettings"][0]{..., "logoImageUrl": logoImage.asset->url}`);
const LANDING_QUERY = defineQuery(`*[_type == "landingPage" && slug.current == $slug][0]{"html": html.code, "templateHtml": templateHtml.code, sections}`);

/* Sections store which markup variant they use as a hidden JSON string
   ("design"); turn those back into objects for the components. */
function parseDesign<T>(v: T): T {
  if (Array.isArray(v)) return v.map(parseDesign) as T;
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => {
        if (k === 'design' && typeof x === 'string') {
          try {
            return [k, JSON.parse(x)];
          } catch {
            return [k, undefined];
          }
        }
        return [k, parseDesign(x)];
      }),
    ) as T;
  }
  return v;
}

/** Route segments -> the page's path ("/", "/acne", "/blog/x"). */
export const toUrlPath = (segments?: string[]) => '/' + (segments ?? []).map(decodeURIComponent).join('/');

const normalise = (p: string) => p.replace(/\/+$/, '') || '/';

export const getPage = cache(async (urlPath: string): Promise<Page | null> => {
  const p = normalise(urlPath);
  return parseDesign(await client.fetch<Page | null>(PAGE_QUERY, { path: p }, FETCH_OPTS));
});

/** A blog post by its address (/blog/<slug>). */
export const getPost = cache(async (urlPath: string): Promise<(Post & DocMeta) | null> => {
  const m = normalise(urlPath).match(/^\/blog\/([^/]+)$/);
  if (!m) return null;
  return parseDesign(await client.fetch<(Post & DocMeta) | null>(POST_QUERY, { slug: m[1] }, FETCH_OPTS));
});

/** Every post, newest first (blog grid, sidebar, previous / next). */
export const getPostCards = cache(async (): Promise<PostCard[]> => client.fetch<PostCard[]>(CARDS_QUERY, {}, FETCH_OPTS));

/** A page or a blog post at this address, with the fields the layout needs. */
export const getDoc = cache(async (urlPath: string) => {
  const post = await getPost(urlPath);
  // headTitle: the browser-tab / Google title (a post's SEO title, else its title).
  if (post) return { kind: 'post' as const, ...post, headTitle: post.seoTitle || post.title };
  const page = await getPage(urlPath);
  return page ? { kind: 'page' as const, ...page, headTitle: page.title } : null;
});

/** A Redirect (Sanity → Redirects) for an address that has no page. Old
    ".html" sources match too: proxy.ts strips ".html" before pages run. */
export async function getRedirect(urlPath: string): Promise<string | null> {
  const p = normalise(urlPath);
  return client.fetch<string | null>(REDIRECT_QUERY, { paths: [p, `${p}.html`, `${p}/index.html`] }, FETCH_OPTS);
}

export async function getAllPaths(): Promise<string[]> {
  return client.fetch<string[]>(PATHS_QUERY, {}, FETCH_OPTS);
}

/* Shapes only (no content): an empty field in Site Settings shows nothing
   rather than breaking the page. */
const EMPTY: SiteSettings = {
  logo: '', logoAlt: '', callDisplay: '', callTel: '', bookUrl: '', nav: [], footerBlurb: '',
  social: { facebook: '', instagram: '', youtube: '', x: '' },
  footerTreatments: [], footerClinic: [], locations: [], email: '', hours: '', legal: [],
  bookLabel: '', bookLabelShort: '', footerHeadings: { treatments: '', clinic: '', visit: '', hours: '' }, copyright: '',
  notFound: { eyebrow: '', title: '', buttonLabel: '', buttonHref: '/' }, whatsappUrl: '',
  siteUrl: 'https://revivaskinandsurgery.com', clinicName: '', gaId: '', gtmId: '', googleVerification: '',
  postCta: { eyebrow: '', title: '', text: '', altText: '', whatsappLabel: '', whatsappHref: '', bookLabel: '', bookHref: '' },
  blogSidebar: { treatmentsTitle: '', treatments: [], ctaEyebrow: '', ctaTitle: '', ctaText: '', ctaButtonLabel: '', ctaButtonHref: '' },
};

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const s = await client.fetch<(Partial<SiteSettings> & { logoImageUrl?: string }) | null>(SETTINGS_QUERY, {}, FETCH_OPTS);
  if (!s) throw new Error('The "Site Settings" document is missing in Sanity.');
  const { logoImageUrl, ...rest } = s;
  const out: Record<string, unknown> = { ...EMPTY };
  for (const [k, v] of Object.entries(rest)) {
    if (v == null || k.startsWith('_')) continue;
    const e = (EMPTY as Record<string, unknown>)[k];
    out[k] = e && typeof e === 'object' && !Array.isArray(e) && typeof v === 'object' ? { ...e, ...v } : v;
  }
  if (logoImageUrl) out.logo = logoImageUrl;
  return out as SiteSettings;
});

/** Full HTML of an /lp/ landing page. */
export async function getLandingHtml(slug: string): Promise<string | null> {
  const lp = await client.fetch<{ html?: string; templateHtml?: string; sections?: PageSection[] } | null>(LANDING_QUERY, { slug }, FETCH_OPTS);
  if (!lp) return null;
  return lp.templateHtml ? renderFields(lp.templateHtml, lp.sections) : (lp.html ?? null);
}

