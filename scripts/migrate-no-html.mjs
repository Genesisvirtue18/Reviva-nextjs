/*
 * One-off: removes the last HTML from the site's content in Sanity.
 *   - pages that still had a fixed-design section are converted again from
 *     their original page into components (Contact form & details, article
 *     notes, cards...)
 *   - links in text: stored HTML attributes -> "URL" + "Open in a new tab";
 *     the doctor-name <span class> -> the "Doctor name style"
 *   - button texts become rich text lines
 *   - stored head / tracking / script HTML is removed (the layout renders
 *     those from Site Settings now)
 *
 *   node --env-file=.env.local scripts/migrate-no-html.mjs --backup <file.json> [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@sanity/client';
import { parsePage } from './lib/parse-page.mjs';
import { makeShaper } from './lib/sanity-shape.mjs';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_WRITE_TOKEN,
  apiVersion: '2025-01-01',
  useCdn: false,
  perspective: 'raw',
});
const DRY = process.argv.includes('--dry');
const arg = (n) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : undefined);
const { shape } = makeShaper(client, { dry: DRY });

const docs = await client.fetch(`*[_type in ["page", "post"]]`);
if (arg('--backup')) fs.writeFileSync(arg('--backup'), JSON.stringify(docs));

const original = Object.fromEntries(
  fs.readdirSync(path.resolve('content/pages')).map((f) => {
    const p = JSON.parse(fs.readFileSync(path.resolve('content/pages', f), 'utf8'));
    return [p.path, p.contentHtml];
  }),
);

const hasCustom = (v) => JSON.stringify(v ?? null).includes('"_type":"customSection"');

let markFixes = 0;
function fixRich(v) {
  if (Array.isArray(v)) return v.map(fixRich);
  if (!v || typeof v !== 'object') return v;
  if (v._type === 'block') {
    const named = new Set();
    v.markDefs = (v.markDefs ?? []).flatMap((d) => {
      if (d._type === 'link') {
        let a = {};
        try {
          a = d.attrs ? JSON.parse(d.attrs) : {};
        } catch {}
        const { attrs, ...rest } = d;
        void attrs;
        markFixes += d.attrs ? 1 : 0;
        return [{ ...rest, ...(a.target === '_blank' ? { newTab: true } : {}) }];
      }
      if (d._type === 'styled') {
        markFixes++;
        if (d.tag === 'span' && d.attrs && JSON.parse(d.attrs).class === 'highlight-name') named.add(d._key);
        else throw new Error(`Unexpected styled text left: ${JSON.stringify(d)}`);
        return [];
      }
      return [d];
    });
    if (named.size) v.children = v.children.map((c) => ({ ...c, marks: (c.marks ?? []).map((m) => (named.has(m) ? 'nameHighlight' : m)) }));
    return v;
  }
  const out = {};
  for (const [k, x] of Object.entries(v)) out[k] = fixRich(x);
  // Button texts: plain string -> one rich line.
  if (out._type === 'articleButton' && typeof out.label === 'string') {
    out.label = [{ _type: 'block', _key: `${out._key}l`, style: 'normal', markDefs: [], children: [{ _type: 'span', _key: `${out._key}s`, text: out.label, marks: [] }] }];
  }
  return out;
}

const tx = [];
let reparsed = 0;
for (const d of docs) {
  const set = {};
  if (d._type === 'page' && hasCustom(d.blocks)) {
    if (!original[d.path]) throw new Error(`No original for ${d.path}`);
    const parsed = parsePage(original[d.path]);
    if (hasCustom(parsed.blocks)) throw new Error(`${d.path} still has a fixed-design section`);
    set.blocks = await shape(parsed.blocks, d.path);
    reparsed++;
  } else if (d.blocks || d.body) {
    const field = d._type === 'post' ? 'body' : 'blocks';
    const fixed = fixRich(structuredClone(d[field]));
    if (JSON.stringify(fixed) !== JSON.stringify(d[field])) set[field] = fixed;
  }
  const unset = ['headHtml', 'bodyStartHtml', 'bodyEndHtml', 'scriptsHtml'].filter((k) => d[k] !== undefined);
  if (!Object.keys(set).length && !unset.length) continue;
  tx.push((t) => t.patch(d._id, (p) => p.ifRevisionId(d._rev).set(set).unset(unset)));
}
console.log(`${docs.length} documents: ${reparsed} pages re-converted, ${markFixes} link/style marks converted, ${tx.length} documents to update`);
if (DRY) process.exit(0);
for (let i = 0; i < tx.length; i += 20) {
  const t = client.transaction();
  tx.slice(i, i + 20).forEach((fn) => fn(t));
  await t.commit({ visibility: 'async' });
}
console.log('Done.');
