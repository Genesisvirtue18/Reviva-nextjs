/*
 * Shared by the migration scripts: turns parsed blocks into Sanity-ready
 * values - "_type" on array items, hidden "design" objects as JSON, and
 * pictures uploaded from public/ so the Studio shows them.
 */
import fs from 'node:fs';
import path from 'node:path';

export function makeShaper(client, { dry = false } = {}) {
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
      uploads.set(file, dry ? Promise.resolve('image-dry') : client.assets.upload('image', fs.createReadStream(file), { filename: path.basename(file) }).then((a) => a._id));
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
    'articleCard.items': 'articleListItem',
    'contactSection.details': 'contactDetail',
    'contactSection.maps': 'contactMap',
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

  return { shape, attachImage, uploads };
}
