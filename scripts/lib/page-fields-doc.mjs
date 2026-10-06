/*
 * Turns a page's HTML into the Sanity fields (layout template + editable
 * sections) and uploads its pictures from public/ to Sanity, so editors see
 * a thumbnail of each one. Uploads are cached per file and deduplicated by
 * Sanity, so re-running is cheap.
 */
import fs from 'node:fs';
import path from 'node:path';
import { extractFields } from './html-fields.mjs';

const PUBLIC = path.resolve('public');
const uploaded = new Map();

/** "assets/images/a b.webp", "../assets/…", "/lp/x/images/…" -> file in public/, if any. */
function localFile(src, pagePath) {
  if (!src || /^(https?:|data:|\/\/)/i.test(src)) return null;
  const clean = src.split('#')[0].split('?')[0];
  let rel;
  try {
    rel = decodeURIComponent(path.posix.resolve(path.posix.dirname(pagePath), clean));
  } catch {
    return null;
  }
  const file = path.join(PUBLIC, rel);
  return file.startsWith(PUBLIC) && fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
}

async function uploadImage(client, file) {
  if (!uploaded.has(file)) {
    uploaded.set(
      file,
      client.assets.upload('image', fs.createReadStream(file), { filename: path.basename(file) }).then(
        (a) => a._id,
        (e) => {
          console.warn(`  ! could not upload ${path.relative(PUBLIC, file)}: ${e.message}`);
          return null;
        },
      ),
    );
  }
  return uploaded.get(file);
}

/** { templateHtml, sections } ready to store on a page / landing page document. */
export async function toFieldDoc(client, html, pagePath) {
  const { template, sections } = extractFields(html);
  for (const section of sections) {
    for (const item of section.items) {
      if (item._type !== 'imageItem') continue;
      const file = localFile(item.originalSrc, pagePath);
      const assetId = file && (await uploadImage(client, file));
      if (assetId) {
        item.image = { _type: 'image', asset: { _type: 'reference', _ref: assetId } };
        item.originalAssetId = assetId;
      }
    }
  }
  return { templateHtml: { _type: 'code', language: 'html', code: template }, sections };
}
