/*
 * One-off: gold words were an annotation ("styled" <span>), which does not
 * grow when an editor types at its end ("Integrit" gold + "y" white). They
 * become the "highlight" decorator, which behaves like Bold. Words already
 * split that way are joined back into the gold part.
 *
 *   node --env-file=.env.local scripts/gold-decorator-migrate.mjs
 */
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_WRITE_TOKEN,
  apiVersion: '2025-01-01',
  useCdn: false,
  perspective: 'raw',
});

let converted = 0;
let joined = 0;

function fixBlock(b) {
  const gold = new Set((b.markDefs ?? []).filter((d) => d._type === 'styled' && d.tag === 'span' && !d.attrs).map((d) => d._key));
  if (gold.size) {
    b.markDefs = b.markDefs.filter((d) => !gold.has(d._key));
    for (const c of b.children ?? []) {
      if (!c.marks) continue;
      if (c.marks.some((m) => gold.has(m))) converted++;
      c.marks = c.marks.map((m) => (gold.has(m) ? 'highlight' : m));
    }
  }
  const kids = b.children ?? [];
  // "Integrit"(gold) + "y …"(plain): letters continuing a gold word join it.
  for (let i = 1; i < kids.length; i++) {
    const a = kids[i - 1];
    const c = kids[i];
    if (a._type !== 'span' || c._type !== 'span') continue;
    const aGold = a.marks?.includes('highlight');
    const cGold = c.marks?.includes('highlight');
    if (aGold && !cGold && /[\p{L}\p{N}]$/u.test(a.text) && /^[\p{L}\p{N}]/u.test(c.text)) {
      const lead = c.text.match(/^[\p{L}\p{N}'’-]+/u)[0];
      a.text += lead;
      c.text = c.text.slice(lead.length);
      joined++;
    }
  }
  // Merge neighbours with the same marks; drop empty spans.
  const out = [];
  for (const c of kids) {
    if (c._type === 'span' && c.text === '' && kids.length > 1) continue;
    const last = out[out.length - 1];
    if (last && last._type === 'span' && c._type === 'span' && (last.marks ?? []).join() === (c.marks ?? []).join()) last.text += c.text;
    else out.push(c);
  }
  b.children = out.length ? out : kids.slice(0, 1);
}

function walk(v) {
  if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === 'object') {
    if (v._type === 'block') fixBlock(v);
    Object.values(v).forEach(walk);
  }
}

const docs = await client.fetch(`*[_type in ["page", "post", "landingPage"]]`);
for (const d of docs) {
  const before = JSON.stringify(d);
  walk(d);
  if (JSON.stringify(d) === before) continue;
  const fields = Object.fromEntries(Object.entries(d).filter(([k]) => !k.startsWith('_')));
  await client.patch(d._id).ifRevisionId(d._rev).set(fields).commit();
  console.log('  updated', d._id);
}
console.log(`Gold words converted: ${converted}; split words joined: ${joined}.`);
