/*
 * Uploads the migrated site into Sanity: every page in content/pages plus the
 * Site Settings singleton. Safe to re-run - documents are created or replaced
 * by their fixed _id.
 *
 *   node --env-file=.env.local scripts/import-to-sanity.mjs
 *
 * Needs NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and
 * SANITY_API_WRITE_TOKEN (an Editor token from sanity.io/manage → API).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@sanity/client';

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

const toCode = (code) => (code ? { _type: 'code', language: 'html', code } : undefined);
const docs = [
  { _id: 'siteSettings', _type: 'siteSettings', ...withKeys(defaultSettings) },
  ...pages.map((p) => ({
    ...p,
    contentHtml: toCode(p.contentHtml),
    headHtml: toCode(p.headHtml),
    bodyStartHtml: toCode(p.bodyStartHtml),
    bodyEndHtml: toCode(p.bodyEndHtml),
  })),
];

for (let i = 0; i < docs.length; i += 20) {
  const tx = client.transaction();
  docs.slice(i, i + 20).forEach((d) => tx.createOrReplace(d));
  await tx.commit({ visibility: 'async' });
  console.log(`  ${Math.min(i + 20, docs.length)}/${docs.length}`);
}
console.log(`Imported ${pages.length} pages + Site Settings into ${projectId}/${dataset}.`);
