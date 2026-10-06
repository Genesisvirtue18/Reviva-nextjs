import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import { defineQuery } from 'next-sanity';
import { client } from './sanity';
import { defaultSettings } from './defaults';
import { renderFields } from './render-fields';
import type { DocMeta, Page, PageSection, SiteSettings } from './types';
import type { Post, PostCard } from '@/components/blog';

/* Content comes from Sanity when it is configured, otherwise from the JSON
   snapshot of the old site in content/pages (written by
   scripts/extract-html.mjs). Tagged fetches let the Sanity webhook refresh
   pages the moment an editor publishes. */

const FETCH_OPTS = { next: { revalidate: 3600, tags: ['sanity'] } };

// Technical HTML fields were Sanity "code" objects ({code}); now plain text.
const html = (f: string) => `"${f}": coalesce(${f}.code, ${f})`;
const META = `_id, title, metaDescription, bodyClass, ${html('headHtml')}, ${html('bodyStartHtml')}, ${html('bodyEndHtml')}`;
const PAGE_QUERY = defineQuery(`*[_type == "page" && path == $path][0]{
  ${META}, path, name, blocks, whatsapp, scriptsHtml,
  "contentHtml": coalesce(contentHtml.code, ""), "templateHtml": templateHtml.code, sections }`);
const POST_FIELDS = `title, "path": "/blog/" + slug.current, publishedAt, readMinutes, excerpt, cover`;
const POST_QUERY = defineQuery(`*[_type == "post" && slug.current == $slug][0]{
  ${META}, ${POST_FIELDS}, author, body, design, seoTitle }`);
const CARDS_QUERY = defineQuery(`*[_type == "post" && defined(slug.current) && defined(publishedAt)] | order(publishedAt desc, _createdAt desc){ ${POST_FIELDS} }`);
const PATHS_QUERY = defineQuery(`[...*[_type == "page" && defined(path)].path, ...*[_type == "post" && defined(slug.current)]{"p": "/blog/" + slug.current}.p]`);
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

const localPages = cache((): Page[] => {
  const dir = path.join(process.cwd(), 'content/pages');
  return fs.readdirSync(dir).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as Page);
});

/** Route segments -> the page's path ("/", "/acne", "/blog/x"). */
export const toUrlPath = (segments?: string[]) => '/' + (segments ?? []).map(decodeURIComponent).join('/');

const normalise = (p: string) => p.replace(/\/+$/, '') || '/';

export const getPage = cache(async (urlPath: string): Promise<Page | null> => {
  const p = normalise(urlPath);
  if (client) return parseDesign(await client.fetch<Page | null>(PAGE_QUERY, { path: p }, FETCH_OPTS));
  return localPages().find((pg) => pg.path === p) ?? null;
});

/** A blog post by its address (/blog/<slug>). */
export const getPost = cache(async (urlPath: string): Promise<(Post & DocMeta) | null> => {
  const m = normalise(urlPath).match(/^\/blog\/([^/]+)$/);
  if (!m || !client) return null;
  return parseDesign(await client.fetch<(Post & DocMeta) | null>(POST_QUERY, { slug: m[1] }, FETCH_OPTS));
});

/** Every post, newest first (blog grid, sidebar, previous / next). */
export const getPostCards = cache(async (): Promise<PostCard[]> => (client ? client.fetch<PostCard[]>(CARDS_QUERY, {}, FETCH_OPTS) : []));

/** A page or a blog post at this address, with the fields the layout needs. */
export const getDoc = cache(async (urlPath: string) => {
  const post = await getPost(urlPath);
  // headTitle: the browser-tab / Google title (a post's SEO title, else its title).
  if (post) return { kind: 'post' as const, ...post, headTitle: post.seoTitle || post.title };
  const page = await getPage(urlPath);
  return page ? { kind: 'page' as const, ...page, headTitle: page.title } : null;
});

export async function getAllPaths(): Promise<string[]> {
  if (client) return client.fetch<string[]>(PATHS_QUERY, {}, FETCH_OPTS);
  return localPages().map((pg) => pg.path);
}

const filled = (o: object) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== ''));

export const getSettings = cache(async (): Promise<SiteSettings> => {
  if (!client) return defaultSettings;
  const { logoImageUrl, ...s } =
    (await client.fetch<(Partial<SiteSettings> & { logoImageUrl?: string }) | null>(SETTINGS_QUERY, {}, FETCH_OPTS)) ?? {};
  // Any field left blank in the Studio keeps the original site's value - also
  // inside grouped fields like footerHeadings.
  const merged: Record<string, unknown> = { ...defaultSettings };
  for (const [k, v] of Object.entries(filled(s))) {
    const d = merged[k];
    merged[k] = d && typeof d === 'object' && !Array.isArray(d) && typeof v === 'object' && !Array.isArray(v) ? { ...d, ...filled(v) } : v;
  }
  if (logoImageUrl) merged.logo = logoImageUrl;
  return merged as SiteSettings;
});

/** Full HTML of an /lp/ landing page from Sanity, or null to use the bundled copy. */
export async function getLandingHtml(slug: string): Promise<string | null> {
  if (!client) return null;
  const lp = await client.fetch<{ html?: string; templateHtml?: string; sections?: PageSection[] } | null>(LANDING_QUERY, { slug }, FETCH_OPTS);
  if (!lp) return null;
  return lp.templateHtml ? renderFields(lp.templateHtml, lp.sections) : (lp.html ?? null);
}

/** The page body: the layout filled with the editable sections, or the stored HTML. */
export const pageBody = (page: Page) => (page.templateHtml ? renderFields(page.templateHtml, page.sections) : page.contentHtml);
