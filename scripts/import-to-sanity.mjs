/*
 * Uploads the migrated site into Sanity: every page in content/pages, the /lp/
 * landing pages and redirects, plus the
 * Site Settings singleton. Safe to re-run - documents are created or replaced
 * by their fixed _id.
 *
 *   node --env-file=.env.local scripts/import-to-sanity.mjs
 *
 * Then run `npm run sanity:migrate-blocks -- --from-local` to turn the pages
 * into page-builder sections and the blog pages into blog posts.
 *
 * Needs NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and
 * SANITY_API_WRITE_TOKEN (an Editor token from sanity.io/manage → API).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@sanity/client';
import { toFieldDoc } from './lib/page-fields-doc.mjs';

const { NEXT_PUBLIC_SANITY_PROJECT_ID: projectId, NEXT_PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_API_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) {
  console.error('Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN in .env.local first.');
  process.exit(1);
}
const client = createClient({ projectId, dataset, token, apiVersion: '2025-01-01', useCdn: false });

// Arrays of objects need a _key per item in Sanity.
let n = 0;
const withKeys = (v) =>
  Array.isArray(v)
    ? v.map((x) => (x && typeof x === 'object' && !Array.isArray(x) ? { _key: `k${(n++).toString(36)}`, ...withKeys(x) } : withKeys(x)))
    : v && typeof v === 'object'
      ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, withKeys(x)]))
      : v;

// Site Settings seed = lib/defaults.ts (Node 22.18+ strips the TS types itself).
const { defaultSettings } = await import(path.resolve('lib/defaults.ts'));

const dir = path.resolve('content/pages');
const pages = fs.readdirSync(dir).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));

// Landing pages: every public/lp/<slug>/index.html.
const lpDir = path.resolve('public/lp');
const landing = [];
for (const slug of fs.readdirSync(lpDir).filter((d) => fs.existsSync(path.join(lpDir, d, 'index.html')))) {
  const html = fs.readFileSync(path.join(lpDir, slug, 'index.html'), 'utf8');
  const title = (html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? slug).trim();
  landing.push({ _id: `landing-${slug}`, _type: 'landingPage', title, slug: { _type: 'slug', current: slug }, ...(await toFieldDoc(client, html, `/lp/${slug}/index.html`)) });
}

const redirects = JSON.parse(fs.readFileSync(path.resolve('content/redirects.json'), 'utf8')).map((r, i) => ({
  _id: `redirect-${i}`,
  _type: 'redirect',
  source: r.source,
  destination: r.destination,
}));

// Page text and pictures become editable fields (see scripts/lib/html-fields.mjs).
const toCode = (code) => (code ? { _type: 'code', language: 'html', code } : undefined);
const pageDocs = [];
for (const { contentHtml, ...p } of pages) {
  pageDocs.push({
    ...p,
    ...(await toFieldDoc(client, contentHtml, p.path)),
    headHtml: toCode(p.headHtml),
    bodyStartHtml: toCode(p.bodyStartHtml),
    bodyEndHtml: toCode(p.bodyEndHtml),
  });
}
const docs = [{ _id: 'siteSettings', _type: 'siteSettings', ...withKeys(defaultSettings) }, ...pageDocs, ...landing, ...redirects];

// Small batches: a page with all its fields is a large document.
for (let i = 0; i < docs.length; i += 5) {
  const tx = client.transaction();
  docs.slice(i, i + 5).forEach((d) => tx.createOrReplace(d));
  await tx.commit({ visibility: 'async' });
  console.log(`  ${Math.min(i + 5, docs.length)}/${docs.length}`);
}
console.log(`Imported ${pages.length} pages, ${landing.length} landing pages, ${redirects.length} redirects + Site Settings into ${projectId}/${dataset}.`);
