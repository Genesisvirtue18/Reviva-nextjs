import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import { defineQuery } from 'next-sanity';
import { client } from './sanity';
import { defaultSettings } from './defaults';
import type { Page, SiteSettings } from './types';

/* Content comes from Sanity when it is configured, otherwise from the JSON
   snapshot of the old site in content/pages (written by
   scripts/extract-html.mjs). Tagged fetches let the Sanity webhook refresh
   pages the moment an editor publishes. */

const FETCH_OPTS = { next: { revalidate: 3600, tags: ['sanity'] } };

// HTML fields are Sanity "code" objects ({code, language}); unwrap to strings.
const PAGE_FIELDS = `_id, path, pageType, title, metaDescription, bodyClass,
  "headHtml": headHtml.code, "bodyStartHtml": bodyStartHtml.code,
  "contentHtml": coalesce(contentHtml.code, ""), "bodyEndHtml": bodyEndHtml.code`;
const PAGE_QUERY = defineQuery(`*[_type == "page" && path == $path][0]{${PAGE_FIELDS}}`);
const PATHS_QUERY = defineQuery(`*[_type == "page" && defined(path)].path`);
const SETTINGS_QUERY = defineQuery(`*[_type == "siteSettings"][0]`);

const localPages = cache((): Page[] => {
  const dir = path.join(process.cwd(), 'content/pages');
  return fs.readdirSync(dir).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as Page);
});

/** Route segments -> the old site's URL path ("/", "/acne.html", "/blog/x.html"). */
export const toUrlPath = (segments?: string[]) => '/' + (segments ?? []).map(decodeURIComponent).join('/');

/** "/index.html" was always the same document as "/". */
const normalise = (p: string) => (p === '/index.html' ? '/' : p);

export const getPage = cache(async (urlPath: string): Promise<Page | null> => {
  const p = normalise(urlPath);
  if (client) return client.fetch<Page | null>(PAGE_QUERY, { path: p }, FETCH_OPTS);
  return localPages().find((pg) => pg.path === p) ?? null;
});

export async function getAllPaths(): Promise<string[]> {
  if (client) return client.fetch<string[]>(PATHS_QUERY, {}, FETCH_OPTS);
  return localPages().map((pg) => pg.path);
}

export const getSettings = cache(async (): Promise<SiteSettings> => {
  if (!client) return defaultSettings;
  const s = await client.fetch<Partial<SiteSettings> | null>(SETTINGS_QUERY, {}, FETCH_OPTS);
  // Any field left blank in the Studio keeps the original site's value.
  return { ...defaultSettings, ...Object.fromEntries(Object.entries(s ?? {}).filter(([, v]) => v != null && v !== '')) } as SiteSettings;
});
