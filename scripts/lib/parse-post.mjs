/*
 * Old-site blog post HTML -> a "post" document (components/blog). The parts
 * every post shares (consultation box, previous/next, sidebar) are not
 * stored: they are generated. Throws Unsupported when a post does not fit.
 */
import * as cheerio from 'cheerio';
import { Unsupported, expect, richOf, tagsOf, textOf } from './html-to-rich.mjs';

const cls = (el) => (el.attribs?.class ?? '').trim();

/** The /blogs index: per post path -> { publishedAt, readMinutes, excerpt }. */
export function parseBlogIndex(html) {
  const $ = cheerio.load(html, null, false);
  const out = {};
  $('.blog-card').each((i, a) => {
    const $a = $(a);
    out[$a.attr('href')] = {
      publishedAt: $a.find('time').attr('datetime'),
      readMinutes: parseInt($a.find('.blog-card__meta > span').last().text(), 10) || undefined,
      excerpt: $a.find('.blog-card__body > p').text().trim(),
      order: i,
    };
  });
  return out;
}

export function parsePost(html) {
  const $ = cheerio.load(html, null, false);
  const top = $.root().children().toArray().filter((n) => !(n.type === 'tag' && cls(n) === 'rv-scrim'));
  if (top.length !== 1) throw new Unsupported(`post: ${top.length} top-level elements`);
  const outer = top[0];
  const design = {};
  if (outer.name === 'section' && cls(outer) === 'blog-page') design.outer = 'blog-page';
  else if (outer.name === 'div' && cls(outer) === 'main-wrapper') design.outer = 'main-wrapper';
  else throw new Unsupported(`post wrapper <${outer.name}.${cls(outer)}>`);

  let cols = tagsOf(outer);
  if (cols.length === 1 && cls(cols[0]) === 'blog-container') {
    design.container = true;
    cols = tagsOf(cols[0]);
  }
  const aside = cols[cols.length - 1];
  expect(aside, 'aside', 'rv-bs');
  let parts;
  if (cols.length === 2 && ['blog-left', 'blog-container'].includes(cls(cols[0]))) {
    parts = tagsOf(cols[0]);
    if (cls(cols[0]) !== 'blog-left') design.leftClass = cls(cols[0]);
  }
  else {
    // No .blog-left wrapper: the article parts sit beside the sidebar.
    design.left = false;
    parts = cols.slice(0, -1);
  }
  const [h1, meta, img, content, pe] = parts;
  if (parts.length !== 5) throw new Unsupported(`post parts: ${parts.length}`);
  expect(h1, 'h1');
  if (cls(h1)) design.titleClass = cls(h1);
  expect(meta, 'div', 'blog-meta');
  const [author, date] = tagsOf(meta);
  expect(content, 'div', 'blog-content');
  expect(pe, 'div', 'rv-pe');

  let imgEl;
  if (img.name === 'img' && cls(img) === 'featured-image') {
    design.image = 'featured';
    imgEl = img;
  } else if (img.name === 'img' && cls(img) === 'blog-image') {
    design.image = 'class';
    imgEl = img;
  } else if (img.name === 'div' && cls(img) === 'blog-image') {
    design.image = 'wrapped';
    [imgEl] = tagsOf(img);
    expect(imgEl, 'img');
  } else throw new Unsupported('post image');

  return {
    // A forced line break in a title becomes a space (the heading wraps by itself).
    title: textOf(h1).replace(/\s*\n\s*/g, ' ').trim(),
    author: textOf(author),
    dateText: textOf(date),
    cover: { src: (imgEl.attribs.src ?? '').replace(/^(\.\.\/)+/, '/').replace(/^(?!\/|https?:)/, '/'), alt: imgEl.attribs.alt },
    body: richOf(content),
    design,
  };
}
