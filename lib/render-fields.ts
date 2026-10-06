import * as cheerio from 'cheerio';
import type { PageSection, PortableBlock } from './types';

/* Rebuilds a page from its layout template and the editable fields made by
   scripts/lib/html-fields.mjs: each [data-cms] element gets its text or
   image back from the matching item. Items an editor never touched render
   exactly as the original markup. */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s: string) => esc(s).replace(/"/g, '&quot;');

const DECORATOR_TAG: Record<string, string> = { strong: 'strong', em: 'em', underline: 'u', highlight: 'span' };

/* Original attributes in their original order; `override` (an edited href)
   replaces a value in place. */
const attrString = (json?: string, override: Record<string, string | undefined> = {}) => {
  let attrs: Record<string, string> = {};
  try {
    attrs = json ? JSON.parse(json) : {};
  } catch {}
  return Object.entries({ ...attrs, ...override })
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => (v === '' ? ` ${k}` : ` ${k}="${escAttr(v!)}"`))
    .join('');
};

export function portableTextToHtml(blocks: PortableBlock[] = []): string {
  return blocks
    .filter((b) => b._type === 'block')
    .map((block) => {
      const defs = new Map((block.markDefs ?? []).map((d) => [d._key, d]));
      const open = (m: string) => {
        if (DECORATOR_TAG[m]) return `<${DECORATOR_TAG[m]}>`;
        const d = defs.get(m);
        if (!d) return '';
        if (d._type === 'link') return `<a${attrString(d.attrs, { href: d.href ?? '' })}>`;
        return `<${d.tag || 'span'}${attrString(d.attrs)}>`;
      };
      const close = (m: string) => {
        if (DECORATOR_TAG[m]) return `</${DECORATOR_TAG[m]}>`;
        const d = defs.get(m);
        if (!d) return '';
        return d._type === 'link' ? '</a>' : `</${d.tag || 'span'}>`;
      };

      let out = '';
      let stack: string[] = [];
      for (const child of block.children ?? []) {
        // Inline objects sit outside any marks.
        const marks = child._type === 'span' ? (child.marks ?? []) : [];
        let common = 0;
        while (common < stack.length && common < marks.length && stack[common] === marks[common]) common++;
        out += stack.slice(common).reverse().map(close).join('');
        out += marks.slice(common).map(open).join('');
        stack = [...marks];
        out += child._type === 'span' ? esc(child.text ?? '').replace(/\n/g, '<br>') : (child.html ?? '');
      }
      return out + stack.reverse().map(close).join('');
    })
    .join('<br>');
}

/** image-<id>-<w>x<h>-<ext> -> its CDN URL. */
const assetUrl = (ref: string) => {
  const m = ref.match(/^image-([a-f0-9]+-\d+x\d+)-(\w+)$/);
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
  return m && projectId ? `https://cdn.sanity.io/images/${projectId}/${dataset}/${m[1]}.${m[2]}?auto=format` : null;
};

export function renderFields(template: string, sections: PageSection[] = []): string {
  const isDocument = /^\s*(<!doctype|<html)/i.test(template);
  const $ = isDocument ? cheerio.load(template) : cheerio.load(template, null, false);
  const items = new Map(sections.flatMap((s) => s.items ?? []).map((it) => [it._key, it]));

  $('[data-cms]').each((_, el) => {
    const $el = $(el);
    const item = items.get($el.attr('data-cms')!);
    $el.removeAttr('data-cms');
    if (!item) return;
    if (item._type === 'imageItem') {
      const ref = item.image?.asset?._ref;
      const replaced = ref && ref !== item.originalAssetId ? assetUrl(ref) : null;
      if (replaced) $el.attr('src', replaced).removeAttr('srcset');
      $el.attr('alt', item.alt ?? '');
      return;
    }
    $el.html(portableTextToHtml(item.content));
    if (item.href !== undefined && el.tagName === 'a') $el.attr('href', item.href);
  });

  return $.html();
}
