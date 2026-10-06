/*
 * One-off: rebuilds the site's content in Sanity as structured documents.
 *   - every blog page becomes a "post" (title, author, date, cover, article)
 *   - every other page gets "blocks": page-builder sections (components/blocks)
 * The source is each page's CURRENT content in Sanity (layout + fields), so
 * edits made in the Studio are kept. Pictures are uploaded so the Studio shows
 * them; an image an editor already replaced keeps that replacement.
 *
 *   node --env-file=.env.local scripts/migrate-to-blocks.mjs --backup <file.json> [--from-local] [--dry]
 *
 * --from-local parses the original pages in content/pages instead (cleaner
 * markup); use it only while the Sanity copies are unedited.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@sanity/client';
import { parsePage } from './lib/parse-page.mjs';
import { parseBlogIndex, parsePost } from './lib/parse-post.mjs';

const { renderFields } = await import(path.resolve('lib/render-fields.ts'));
const { NEXT_PUBLIC_SANITY_PROJECT_ID: projectId, NEXT_PUBLIC_SANITY_DATASET: dataset = 'production', SANITY_API_WRITE_TOKEN: token } = process.env;
if (!projectId || !token) throw new Error('Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN');
const client = createClient({ projectId, dataset, token, apiVersion: '2025-01-01', useCdn: false, perspective: 'raw' });
const arg = (n) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : undefined);
const DRY = process.argv.includes('--dry');

const docs = await client.fetch(`*[_type == "page"]`);
const backup = arg('--backup');
if (backup) fs.writeFileSync(backup, JSON.stringify(docs));
console.log(`${docs.length} page documents${backup ? ` (backed up to ${backup})` : ''}`);

const codeText = (v) => (v && typeof v === 'object' ? v.code : v) || undefined;
// Source HTML: the original page (content/pages) when the Sanity copy has not
// been edited (same text, pictures and links - checked by the caller), else
// the Sanity copy rendered from its fields.
const local = Object.fromEntries(
  fs.readdirSync(path.resolve('content/pages')).map((f) => {
    const p = JSON.parse(fs.readFileSync(path.resolve('content/pages', f), 'utf8'));
    return [p.path, p.contentHtml];
  }),
);
const currentHtml = (d) =>
  (process.argv.includes('--from-local') && local[d.path]) || (d.templateHtml?.code ? renderFields(d.templateHtml.code, d.sections) : codeText(d.contentHtml) ?? '');

// ---- pictures -------------------------------------------------------------------
const PUBLIC = path.resolve('public');
const uploads = new Map();
const CDN = /^https:\/\/cdn\.sanity\.io\/images\/[^/]+\/[^/]+\/([a-f0-9]+-\d+x\d+)\.(\w+)/;
async function attachImage(pic, pagePath) {
  if (!pic?.src) return pic;
  const cdn = pic.src.match(CDN);
  if (cdn) {
    // Already replaced in the Studio: keep that image.
    const ref = `image-${cdn[1]}-${cdn[2]}`;
    return { ...pic, image: { _type: 'image', asset: { _type: 'reference', _ref: ref } } };
  }
  if (/^(https?:|data:|\/\/)/.test(pic.src)) return pic;
  let file;
  try {
    const rel = decodeURIComponent(path.posix.resolve(path.posix.dirname(pagePath === '/' ? '/x' : pagePath), pic.src.split(/[?#]/)[0]));
    file = path.join(PUBLIC, rel);
  } catch {
    return pic;
  }
  if (!file.startsWith(PUBLIC) || !fs.existsSync(file)) return { ...pic, _missing: true };
  if (!uploads.has(file)) {
    uploads.set(file, DRY ? Promise.resolve('image-dry') : client.assets.upload('image', fs.createReadStream(file), { filename: path.basename(file) }).then((a) => a._id));
  }
  const id = await uploads.get(file);
  return { ...pic, image: { _type: 'image', asset: { _type: 'reference', _ref: id } }, originalAssetId: id };
}

// ---- Sanity shapes: _type on array items, design as JSON, internal props out --------
const ITEM_TYPE = {
  'serviceOverview.columns': 'overviewColumn',
  'procedure.steps': 'procedureStep',
  'faq.items': 'faqItem',
  'legalContent.clauses': 'legalClause',
  'galleryFilters.links': 'linkItem',
  'galleryGrid.photos': 'picture',
  'article.sections': 'articleSection',
  'articleCards.cards': 'articleCard',
  'articleList.items': 'articleListItem',
  'homeHero.contacts': 'heroContact',
  'homeHero.stats': 'heroStat',
  'reviews.reviews': 'review',
  'treatmentCards.cards': 'treatmentCard',
  'clinicGallery.photos': 'picture',
  'signatureTreatments.cards': 'signatureCard',
  'linkGroups.groups': 'linkGroup',
  'linkGroup.links': 'linkItem',
};
const PICTURE_FIELDS = new Set(['picture', 'cover']);

async function shape(value, pagePath, parentType = '', field = '') {
  if (Array.isArray(value)) {
    const out = [];
    for (const v of value) {
      let item = v && typeof v === 'object' && !v._type && ITEM_TYPE[`${parentType}.${field}`] ? { _type: ITEM_TYPE[`${parentType}.${field}`], ...v } : v;
      if (item?._type === 'picture' || item?._type === 'figure') item = await attachImage(item, pagePath);
      out.push(await shape(item, pagePath, parentType, field));
    }
    return out;
  }
  if (value && typeof value === 'object') {
    const type = value._type ?? parentType;
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === '_reason' || k === '_why' || k === '_fallbacks' || k === '_missing') continue;
      if (k === 'design' && v && typeof v === 'object') out[k] = JSON.stringify(v);
      else if (PICTURE_FIELDS.has(k) && v && typeof v === 'object' && !Array.isArray(v)) out[k] = await shape({ _type: 'picture', ...(await attachImage(v, pagePath)) }, pagePath, 'picture', k);
      else if (k === 'templateHtml' && type === 'customSection') out[k] = v;
      else out[k] = await shape(v, pagePath, type, k);
    }
    return out;
  }
  return value;
}

// ---- convert ----------------------------------------------------------------------
const blogsPage = docs.find((d) => d._id === 'page-blogs') ?? docs.find((d) => d.path === '/blogs');
const index = parseBlogIndex(currentHtml(blogsPage));

const tx = [];
let posts = 0;
let pages = 0;
const fallbacks = [];
for (const d of docs) {
  const isDraft = d._id.startsWith('drafts.');
  const html = currentHtml(d);
  const meta = {
    metaDescription: d.metaDescription,
    headHtml: codeText(d.headHtml),
    bodyStartHtml: codeText(d.bodyStartHtml),
    bodyEndHtml: codeText(d.bodyEndHtml),
    bodyClass: d.bodyClass,
  };

  // Posts are decided by address: the old Type switch was set wrongly on Home.
  if (d.path?.startsWith('/blog/')) {
    const slug = d.path.replace(/^\/blog\//, '');
    const p = parsePost(html);
    const info = index[d.path] ?? {};
    const doc = await shape(
      {
        _id: `${isDraft ? 'drafts.' : ''}post-${slug}`,
        _type: 'post',
        title: p.title,
        author: p.author,
        publishedAt: info.publishedAt,
        readMinutes: info.readMinutes,
        excerpt: info.excerpt,
        cover: p.cover,
        body: p.body,
        design: p.design,
        seoTitle: d.title !== p.title ? d.title : undefined,
        slug: { _type: 'slug', current: slug },
        ...meta,
      },
      d.path,
    );
    // A cover whose file does not exist (broken on the old site too) is dropped.
    if (doc.cover && !doc.cover.image && !/^https?:/.test(doc.cover.src ?? '')) delete doc.cover;
    tx.push((t) => t.createOrReplace(doc).delete(d._id));
    posts++;
    continue;
  }

  const parsed = parsePage(html);
  parsed.blocks.forEach((b) => b._type === 'customSection' && fallbacks.push(`${d.path}: ${b.title}`));
  const blocks = await shape(parsed.blocks, d.path);
  tx.push((t) =>
    t.patch(d._id, (p) =>
      p
        .set({ blocks, whatsapp: parsed.whatsapp, ...(parsed.scriptsHtml ? { scriptsHtml: parsed.scriptsHtml } : {}), ...Object.fromEntries(Object.entries(meta).filter(([, v]) => v !== undefined)) })
        .unset(['templateHtml', 'sections', 'contentHtml', 'pageType']),
    ),
  );
  pages++;
}

console.log(`→ ${posts} posts, ${pages} pages; ${uploads.size} pictures; fixed-design sections: ${fallbacks.length}`);
fallbacks.forEach((f) => console.log('   ', f));
if (DRY) {
  console.log('Dry run - nothing written.');
  process.exit(0);
}
for (let i = 0; i < tx.length; i += 10) {
  const t = client.transaction();
  tx.slice(i, i + 10).forEach((fn) => fn(t));
  await t.commit({ visibility: 'async' });
  console.log(`  ${Math.min(i + 10, tx.length)}/${tx.length}`);
}
console.log('Done.');
