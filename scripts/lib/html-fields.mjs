/*
 * Splits a page's HTML into a layout template plus editable fields, so
 * editors change words and pictures in Sanity without touching HTML.
 *
 *   extractFields(html) -> { template, sections }
 *
 * - Every element whose content is only text and inline markup (a heading,
 *   paragraph, button, list item...) becomes a "textItem" holding Portable
 *   Text: bold/italic/underline as decorators, links and other inline tags
 *   (<span class>, <time>...) as annotations that remember their attributes,
 *   and icons (<svg>, empty <i>) as untouchable inline "inlineHtml" objects.
 * - Every <img> becomes an "imageItem".
 * - In the template each of those elements gets data-cms="<item key>"; loose
 *   text sitting next to block elements is wrapped in <span data-cms>.
 * - Items are grouped into one section per top-level block of the page,
 *   titled from the "<!-- HERO SECTION -->"-style comment above it, or its
 *   first heading.
 *
 * lib/render-fields.ts does the reverse at request time.
 */
import * as cheerio from 'cheerio';

const SKIP = new Set(['script', 'style', 'noscript', 'template', 'iframe', 'select', 'textarea', 'pre', 'svg', 'canvas', 'video', 'audio', 'object', 'picture', 'head', 'title', 'meta', 'link']);
const INLINE = new Set(['a', 'span', 'strong', 'b', 'em', 'i', 'u', 'br', 'time', 'small', 'sup', 'sub', 'mark', 'abbr', 'cite', 'q', 's', 'del', 'ins', 'label', 'font', 'code', 'kbd', 'bdi', 'data', 'wbr']);
// Inline things kept verbatim inside text (icons, inputs).
const ATOMIC = new Set(['svg', 'input', 'wbr']);
const DECORATOR = { strong: 'strong', b: 'strong', em: 'em', i: 'em', u: 'underline' };

const LABELS = {
  h1: 'Heading 1', h2: 'Heading 2', h3: 'Heading 3', h4: 'Heading 4', h5: 'Heading 5', h6: 'Heading 6',
  p: 'Paragraph', li: 'List item', a: 'Link / button', button: 'Button', blockquote: 'Quote',
  td: 'Table cell', th: 'Table heading', figcaption: 'Caption', label: 'Label', dt: 'Term', dd: 'Description',
};

const hasText = (node) =>
  node.type === 'text' ? /\S/.test(node.data) : node.type === 'tag' && node.name !== 'svg' && (node.children ?? []).some(hasText);

const isAtomic = (node) => node.type === 'tag' && (ATOMIC.has(node.name) || (node.name === 'i' && !hasText(node)));

/** True when everything inside is text / inline markup / icons (and no <img>).
    Icons and other word-less elements become inline objects, which can't sit
    inside a link or styled span - so they are only allowed as direct
    children; otherwise the walk descends and the inner element (the button
    itself) becomes the text field. */
const inlineOnly = (node, depth = 0) =>
  (node.children ?? []).every(
    (c) =>
      c.type === 'text' ||
      c.type === 'comment' ||
      (c.type === 'tag' &&
        (c.name === 'br' ||
          ((isAtomic(c) || !hasText(c)) ? depth === 0 && c.name !== 'img' && !c.children?.some((x) => x.type === 'tag' && x.name === 'img') : INLINE.has(c.name) && inlineOnly(c, depth + 1)))),
  );

/** Several elements side by side with no words of their own between them
    (two buttons, a label + a phone link): each gets its own field instead of
    sharing one, so editing one can't spill into the other. */
const isGroup = (node) =>
  !(node.children ?? []).some((c) => c.type === 'text' && /\S/.test(c.data)) &&
  (node.children ?? []).filter((c) => c.type === 'tag' && c.name !== 'br' && hasText(c)).length > 1;

const attrsOf = (node, drop = []) => {
  const a = { ...node.attribs };
  drop.forEach((k) => delete a[k]);
  return Object.keys(a).length ? JSON.stringify(a) : undefined;
};

/** Inline HTML of an element -> one Portable Text block. */
function toPortableText($, el, key) {
  const markDefs = [];
  const children = [];
  let n = 0;

  const pushText = (text, marks) => {
    const last = children[children.length - 1];
    if (last && last._type === 'span' && last.marks.join() === marks.join()) last.text += text;
    else children.push({ _type: 'span', _key: `${key}c${n++}`, text, marks: [...marks] });
  };

  const walk = (node, marks) => {
    if (node.type === 'text') return pushText(node.data.replace(/\s+/g, ' '), marks);
    if (node.type !== 'tag') return;
    if (node.name === 'br') return pushText('\n', marks);
    // Icons, and inline elements with no words in them (an icon-only link),
    // are kept whole - an inline object can't carry a link mark.
    if (isAtomic(node) || !hasText(node)) {
      children.push({ _type: 'inlineHtml', _key: `${key}c${n++}`, html: $.html(node) });
      return;
    }
    let mark;
    if (DECORATOR[node.name] && !Object.keys(node.attribs).length) mark = DECORATOR[node.name];
    else if (node.name === 'a') {
      mark = `${key}m${markDefs.length}`;
      markDefs.push({ _type: 'link', _key: mark, href: node.attribs.href ?? '', attrs: attrsOf(node) });
    } else {
      mark = `${key}m${markDefs.length}`;
      markDefs.push({ _type: 'styled', _key: mark, tag: node.name, attrs: attrsOf(node) });
    }
    node.children.forEach((c) => walk(c, [...marks, mark]));
  };
  el.children.forEach((c) => walk(c, []));

  // Collapse whitespace the way the browser renders it. The edges are
  // trimmed unless the element sits inside a run of text (a link in a
  // sentence), where its outer spaces matter.
  const touches = (n) => n && ((n.type === 'text' && /\S/.test(n.data)) || (n.type === 'tag' && INLINE.has(n.name)));
  const inline = INLINE.has(el.name) && (touches(el.prev) || touches(el.next));
  let prevEndsSpace = !inline;
  for (const c of children) {
    if (c._type !== 'span') {
      prevEndsSpace = false;
      continue;
    }
    c.text = c.text.replace(/ ?\n ?/g, '\n');
    if (prevEndsSpace) c.text = c.text.replace(/^ /, '');
    prevEndsSpace = / $|\n$/.test(c.text) || (prevEndsSpace && c.text === '');
  }
  for (let i = children.length - 1; i >= 0 && !inline; i--) {
    const c = children[i];
    if (c._type !== 'span') break;
    c.text = c.text.replace(/ $/, '');
    if (c.text) break;
  }
  const kept = children.filter((c) => c._type !== 'span' || c.text !== '');
  const used = new Set(kept.flatMap((c) => c.marks ?? []));
  return [{ _type: 'block', _key: `${key}b`, style: 'normal', markDefs: markDefs.filter((d) => used.has(d._key)), children: kept }];
}

const plain = (s) => s.replace(/\s+/g, ' ').trim();
const titleCase = (s) => s.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());

export function extractFields(html) {
  const isDocument = /^\s*(<!doctype|<html)/i.test(html);
  const $ = isDocument ? cheerio.load(html) : cheerio.load(html, null, false);
  let root = isDocument ? $('body')[0] : $.root()[0];

  // Descend through lone wrappers (<main><div>...</div></main>) to find the real blocks.
  for (;;) {
    const els = root.children.filter((c) => c.type === 'tag');
    if (els.length === 1 && !root.children.some((c) => c.type === 'text' && /\S/.test(c.data)) && els[0].children.filter((c) => c.type === 'tag').length > 1) root = els[0];
    else break;
  }

  let t = 0;
  let im = 0;
  const sections = [];
  let current = null;

  const textItem = (el, label) => {
    const key = `t${++t}`;
    $(el).attr('data-cms', key);
    const item = { _type: 'textItem', _key: key, label, content: toPortableText($, el, key) };
    if (el.name === 'a' && el.attribs.href !== undefined) item.href = el.attribs.href;
    current.items.push(item);
  };

  const visit = (el) => {
    if (el.type !== 'tag' || SKIP.has(el.name)) return;
    if (el.name === 'img') {
      const key = `i${++im}`;
      $(el).attr('data-cms', key);
      current.items.push({ _type: 'imageItem', _key: key, originalSrc: el.attribs.src ?? '', alt: el.attribs.alt ?? '' });
      return;
    }
    if (hasText(el) && inlineOnly(el) && !isGroup(el)) return textItem(el, LABELS[el.name] ?? 'Text');
    for (const c of [...el.children]) {
      if (c.type === 'text' && /\S/.test(c.data)) {
        const span = $('<span></span>');
        $(c).replaceWith(span);
        span.append(c);
        textItem(span[0], 'Text');
      } else visit(c);
    }
  };

  let pendingComment = null;
  for (const node of [...root.children]) {
    if (node.type === 'comment') {
      if (/\S/.test(node.data)) pendingComment = plain(node.data);
      continue;
    }
    if (node.type === 'text' && !/\S/.test(node.data)) continue;
    if (node.type === 'tag' && SKIP.has(node.name)) continue;

    const heading = node.type === 'tag' ? plain($(node).find('h1,h2,h3').first().text()) : '';
    const cls = node.type === 'tag' ? (node.attribs.class ?? '').split(/\s+/)[0] : '';
    const name = pendingComment ? titleCase(pendingComment) : heading || (cls ? titleCase(cls.replace(/[-_]+/g, ' ')) : 'Section');
    current = { _type: 'pageSection', _key: `s${sections.length + 1}`, title: `${sections.length + 1}. ${name.slice(0, 80)}`, items: [] };
    pendingComment = null;

    if (node.type === 'text') {
      const span = $('<span></span>');
      $(node).replaceWith(span);
      span.append(node);
      textItem(span[0], 'Text');
    } else visit(node);
    if (current.items.length) sections.push(current);
  }
  // Renumber after empty sections were dropped.
  sections.forEach((s, i) => (s.title = s.title.replace(/^\d+\./, `${i + 1}.`)));

  return { template: isDocument ? $.html() : $.html(), sections };
}
