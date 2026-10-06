/*
 * One-off: moves the site from the old ".html" addresses to clean Next.js
 * routes (/about.html -> /about) - page paths and every link: menus, footer,
 * buttons, links inside text, canonical / Open Graph tags, JSON-LD and the
 * redirect list. Runs on Sanity (published + drafts) and on the local copies
 * (content/, lib/defaults.ts, public/llms.txt). Safe to re-run.
 *
 *   node --env-file=.env.local scripts/clean-urls-migrate.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@sanity/client';
import { cleanHref, cleanHtml, cleanPath, cleanValue, setKnownPaths } from './lib/clean-urls.mjs';

const pagesDir = path.resolve('content/pages');
const localPages = fs.readdirSync(pagesDir).map((f) => [f, JSON.parse(fs.readFileSync(path.join(pagesDir, f), 'utf8'))]);
setKnownPaths([...localPages.map(([, p]) => cleanPath(p.path)), '/']);

// --- local copies ----------------------------------------------------------
for (const [f, p] of localPages) {
  const out = { ...cleanValue(p, p.path), path: cleanPath(p.path) };
  fs.writeFileSync(path.join(pagesDir, f), JSON.stringify(out, null, 1) + '\n');
}
const redirectsFile = path.resolve('content/redirects.json');
const redirects = JSON.parse(fs.readFileSync(redirectsFile, 'utf8')).map((r) => ({ ...r, destination: cleanHref(r.destination) }));
fs.writeFileSync(redirectsFile, JSON.stringify(redirects, null, 1) + '\n');

const defaultsFile = path.resolve('lib/defaults.ts');
fs.writeFileSync(defaultsFile, fs.readFileSync(defaultsFile, 'utf8').replace(/(['"])(\/[^'"]*?\.html)\1/g, (_, q, v) => q + cleanHref(v) + q));
const llms = path.resolve('public/llms.txt');
fs.writeFileSync(llms, cleanHtml(fs.readFileSync(llms, 'utf8')));
console.log(`Local: ${localPages.length} pages, ${redirects.length} redirects, defaults, llms.txt`);

// --- Sanity ------------------------------------------------------------------
const { NEXT_PUBLIC_SANITY_PROJECT_ID: projectId, NEXT_PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_API_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) process.exit(0);
const client = createClient({ projectId, dataset, token, apiVersion: '2025-01-01', useCdn: false, perspective: 'raw' });

const docs = await client.fetch(`*[_type in ["page", "landingPage", "siteSettings", "redirect"]]`);
setKnownPaths([...docs.filter((d) => d._type === 'page' && d.path).map((d) => cleanPath(d.path)), '/']);

let changed = 0;
for (const d of docs) {
  const base = d._type === 'page' ? d.path : d._type === 'landingPage' ? `/lp/${d.slug?.current}/index.html` : '/';
  const { _id, _rev, _type } = d;
  const fields = Object.fromEntries(Object.entries(d).filter(([k]) => !k.startsWith('_')));
  const cleaned = cleanValue(fields, base);
  if (_type === 'page' && cleaned.path) cleaned.path = cleanPath(cleaned.path);
  const set = Object.fromEntries(Object.entries(cleaned).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(fields[k])));
  if (!Object.keys(set).length) continue;
  await client.patch(_id).ifRevisionId(_rev).set(set).commit({ visibility: 'async' });
  changed++;
}
console.log(`Sanity: updated ${changed} of ${docs.length} documents.`);
