/*
 * Old-site page HTML -> structured page-builder blocks (the components in
 * components/blocks). Each top-level section is matched by its class and
 * parsed strictly; anything that does not fit its component exactly becomes
 * a "customSection" (fixed layout + text/image fields), so nothing is lost.
 */
import * as cheerio from 'cheerio';
import { extractFields } from './html-fields.mjs';
import { Unsupported, expect, inlineOf, key, richOf, tagsOf, textOf } from './html-to-rich.mjs';

const cls = (el) => (el.attribs?.class ?? '').trim();
const only = (el, n, what) => {
  const t = tagsOf(el);
  if (n !== undefined && t.length !== n) throw new Unsupported(`${what}: ${t.length} children`);
  return t;
};
const noAttrs = (el, allowed = []) => {
  const extra = Object.keys(el.attribs).filter((a) => !allowed.includes(a));
  if (extra.length) throw new Unsupported(`<${el.name}> has ${extra.join(',')}`);
  return el;
};
/** A rich single line (headings with highlighted words etc.). */
const lineOf = (el) => {
  const { children, markDefs } = inlineOf(el);
  return [{ _type: 'block', _key: key('b'), style: 'normal', markDefs, children }];
};

// ---- treatment page sections ---------------------------------------------

function serviceHero(el) {
  const [first, ...rest] = cls(el).split(/\s+/);
  if (first !== 'rv-shero') throw new Unsupported('hero class');
  noAttrs(el, ['class']);
  const [scrim, inner] = only(el, 2, 'hero');
  expect(scrim, 'div', 'rv-shero__scrim');
  expect(inner, 'div', 'rv-shero__inner');
  const b = { _type: 'serviceHero', _key: key('h'), heroClass: rest.join(' ') || undefined };
  for (const c of tagsOf(inner)) {
    if (c.name === 'p' && cls(c) === 'rv-shero__eyebrow' && !b.eyebrow) b.eyebrow = textOf(c);
    else if (c.name === 'h1' && cls(c) === 'rv-shero__title' && !b.title) b.title = textOf(c);
    else if (c.name === 'p' && cls(c) === 'rv-shero__text' && !b.text) b.text = textOf(c);
    else throw new Unsupported(`hero child <${c.name}.${cls(c)}>`);
  }
  // Component renders eyebrow, title, text in that order.
  const order = tagsOf(inner).map((c) => cls(c));
  const want = ['rv-shero__eyebrow', 'rv-shero__title', 'rv-shero__text'].filter((c) => order.includes(c));
  if (order.join() !== want.join()) throw new Unsupported('hero order');
  return b;
}

function serviceOverview(el) {
  expect(el, 'section', 'rv-svc');
  const [wrap] = only(el, 1, 'svc');
  expect(wrap, 'div', 'rv-svc__wrap');
  const parts = tagsOf(wrap);
  const intro = expect(parts[0], 'div', 'rv-svc__intro');
  const [eyebrow, body] = only(intro, 2, 'svc intro');
  expect(eyebrow, 'h2', 'rv-svc__eyebrow');
  expect(body, 'div', 'rv-svc__body');
  const b = { _type: 'serviceOverview', _key: key('o'), heading: textOf(eyebrow), body: richOf(body), columns: [] };
  if (parts.length > 2) throw new Unsupported('svc parts');
  if (parts[1]) {
    const panel = expect(parts[1], 'div', 'rv-svc__panel');
    const [cols] = only(panel, 1, 'svc panel');
    expect(cols, 'div', 'rv-svc__cols');
    for (const col of tagsOf(cols)) {
      expect(col, 'div', 'rv-svc__col');
      const [title, list] = only(col, 2, 'svc col');
      expect(title, 'h3', 'rv-svc__col-title');
      expect(list, 'ul', 'rv-svc__list');
      b.columns.push({ _key: key('c'), title: textOf(title), items: tagsOf(list).map((li) => textOf(noAttrs(expect(li, 'li')))) });
    }
  }
  return b;
}

function procedure(el) {
  expect(el, 'section', 'procedure-section');
  const [box] = only(el, 1, 'procedure');
  const list = cls(box) === 'container';
  expect(box, 'div', list ? 'container' : 'procedure-container');
  const [h2, steps] = only(box, 2, 'procedure box');
  if (list) expect(h2, 'h2', 'section-title');
  else expect(noAttrs(h2), 'h2');
  expect(steps, 'div', list ? 'procedure-list' : 'procedure-steps');
  return {
    _type: 'procedure',
    _key: key('p'),
    variant: list ? 'list' : 'steps',
    heading: textOf(h2),
    steps: tagsOf(steps).map((s, i) => {
      expect(s, 'div', list ? 'procedure-item' : 'step');
      const [num, p] = only(s, 2, 'step');
      expect(noAttrs(num), 'span');
      expect(noAttrs(p), 'p');
      if (textOf(num) !== String(i + 1).padStart(2, '0')) throw new Unsupported('step numbering');
      return { _key: key('s'), text: textOf(p) };
    }),
  };
}

function beforeAfter(el) {
  const section = cls(el);
  if (section !== 'results-section' && section !== 'results-strip') throw new Unsupported('results class');
  noAttrs(el, ['class']);
  const kids = tagsOf(el);
  const design = { section };
  let box = kids[0];
  if (kids.length === 2) {
    expect(kids[0], 'div', 'results-overlay');
    if (tagsOf(kids[0]).length) throw new Unsupported('overlay content');
    design.overlay = true;
    box = kids[1];
  } else if (kids.length !== 1) throw new Unsupported('results children');
  if (cls(box) === 'container results-content') design.container = true;
  else expect(box, 'div', 'results-content');
  const parts = tagsOf(box);
  if (parts.length !== 3 && parts.length !== 4) throw new Unsupported('results parts');
  const [eyebrow, h2, text, a] = parts;
  if (!['span', 'p'].includes(eyebrow.name)) throw new Unsupported('results eyebrow');
  noAttrs(eyebrow, ['class']);
  design.eyebrowTag = eyebrow.name;
  if (cls(eyebrow)) design.eyebrowClass = cls(eyebrow);
  expect(noAttrs(h2), 'h2');
  if (!['span', 'p'].includes(text.name)) throw new Unsupported('results text');
  noAttrs(text);
  design.textTag = text.name;
  const b = { _type: 'beforeAfter', _key: key('r'), design, eyebrow: textOf(eyebrow), heading: textOf(h2), text: textOf(text) };
  if (a) {
    expect(a, 'a');
    noAttrs(a, ['class', 'href']);
    design.buttonClass = cls(a);
    const icons = a.children.filter((c) => c.type === 'tag');
    if (icons.length > 1 || (icons[0] && (icons[0].name !== 'i' || tagsOf(icons[0]).length))) throw new Unsupported('results button');
    if (icons[0]) design.icon = cls(icons[0]);
    b.buttonHref = a.attribs.href;
    b.buttonLabel = a.children.filter((c) => c.type === 'text').map((c) => c.data).join('').replace(/\s+/g, ' ').trim();
  }
  return b;
}

function faq(el) {
  if (cls(el) === 'reviva-faq-wrap') {
    const [inner] = only(el, 1, 'faq wrap');
    expect(inner, 'div', 'reviva-faq-inner');
    const [title, ...items] = tagsOf(inner);
    expect(title, 'h2', 'reviva-faq-title');
    return {
      _type: 'faq',
      _key: key('f'),
      variant: 'accordion',
      heading: textOf(title),
      items: items.map((it) => {
        expect(it, 'div', 'reviva-faq-item');
        const [head, body] = only(it, 2, 'faq item');
        expect(head, 'div', 'reviva-faq-head');
        const [q, icon] = only(head, 2, 'faq head');
        expect(noAttrs(q), 'span');
        expect(icon, 'div', 'reviva-faq-icon');
        expect(body, 'div', 'reviva-faq-body');
        const [content] = only(body, 1, 'faq body');
        expect(content, 'div', 'reviva-faq-content');
        return { _key: key('q'), question: textOf(q), answer: richOf(content) };
      }),
    };
  }
  expect(el, 'section', 'faq-section');
  const [box] = only(el, 1, 'faq');
  // "boxes": <div.faq-container><h2/> then one <div.faq-box> per question.
  const kids = tagsOf(box);
  if (cls(box) === 'faq-container' && kids.length > 2 && kids.slice(1).every((k) => cls(k) === 'faq-box')) {
    expect(noAttrs(kids[0]), 'h2');
    return {
      _type: 'faq',
      _key: key('f'),
      variant: 'boxes',
      heading: textOf(kids[0]),
      items: kids.slice(1).map((fb) => {
        const [q, a] = only(fb, 2, 'faq box');
        expect(q, 'div', 'faq-question');
        const [span, btn] = only(q, 2, 'faq question');
        expect(noAttrs(span), 'span');
        expect(noAttrs(btn), 'button');
        if (textOf(btn) !== '+') throw new Unsupported('faq button');
        expect(a, 'div', 'faq-answer');
        return { _key: key('q'), question: textOf(span), answer: richOf(a) };
      }),
    };
  }
  // "flat": <h2/> then the .faq-item elements directly.
  if (cls(box) === 'faq-container' && kids.length > 2 && kids.slice(1).every((k) => cls(k) === 'faq-item')) {
    expect(noAttrs(kids[0]), 'h2');
    return { _type: 'faq', _key: key('f'), variant: 'flat', heading: textOf(kids[0]), items: kids.slice(1).map(classicFaqItem) };
  }
  const wrapper = cls(box) === 'container';
  expect(box, 'div', wrapper ? 'container' : 'faq-container');
  const [h2, list] = only(box, 2, 'faq box');
  if (wrapper) expect(h2, 'h2', 'faq-title');
  else expect(noAttrs(h2), 'h2');
  const listCls = cls(list);
  const variant = wrapper ? 'wrapper' : listCls === 'faq-list' ? 'list' : 'classic';
  expect(list, 'div', wrapper ? 'faq-wrapper' : variant === 'list' ? 'faq-list' : 'faq-box');
  return {
    _type: 'faq',
    _key: key('f'),
    variant,
    heading: textOf(h2),
    items: tagsOf(list).map(classicFaqItem),
  };
}

function classicFaqItem(it) {
  expect(it, 'div', 'faq-item');
  const [q, a] = only(it, 2, 'faq item');
  expect(q, 'button', 'faq-question');
  const qs = q.children.filter((c) => c.type === 'tag');
  if (qs.length !== 1 || qs[0].name !== 'span' || textOf(qs[0]) !== '+') throw new Unsupported('faq question icon');
  expect(a, 'div', 'faq-answer');
  return { _key: key('q'), question: q.children.filter((c) => c.type === 'text').map((c) => c.data).join('').replace(/\s+/g, ' ').trim(), answer: richOf(a) };
}

function ctaBanner(el) {
  expect(el, 'section', 'rv-endcta');
  const [panel] = only(el, 1, 'cta');
  expect(panel, 'div', 'rv-endcta__panel');
  const [eyebrow, title, text, actions] = only(panel, 4, 'cta panel');
  expect(eyebrow, 'p', 'rv-endcta__eyebrow');
  expect(title, 'h2', 'rv-endcta__title');
  expect(text, 'p', 'rv-endcta__text');
  expect(actions, 'div', 'rv-endcta__actions');
  const btns = tagsOf(actions);
  if (btns.length !== 2) throw new Unsupported('cta buttons');
  const button = (a, kind) => {
    expect(a, 'a', `rv-endcta__btn rv-endcta__btn--${kind}`);
    const newTab = a.attribs.target === '_blank';
    noAttrs(a, ['class', 'href', ...(newTab ? ['target', 'rel'] : [])]);
    if (newTab && a.attribs.rel !== 'noopener') throw new Unsupported('cta rel');
    return { label: a.children.filter((c) => c.type === 'text').map((c) => c.data).join('').replace(/\s+/g, ' ').trim(), href: a.attribs.href, newTab: newTab || undefined };
  };
  return {
    _type: 'ctaBanner',
    _key: key('e'),
    eyebrow: textOf(eyebrow),
    heading: textOf(title),
    text: textOf(text),
    primary: button(btns[0], 'solid'),
    secondary: button(btns[1], 'ghost'),
  };
}

function banner(el) {
  if (tagsOf(el).length || el.children.some((c) => c.type === 'text' && /\S/.test(c.data))) throw new Unsupported('banner content');
  noAttrs(el, ['class']);
  return { _type: 'banner', _key: key('n'), tag: el.name, className: cls(el) };
}

// ---- heroes, legal pages, galleries ------------------------------------------

const isStars = (el) =>
  el.name === 'div' && cls(el) === 'shooting-stars' && tagsOf(el).length === 5 && tagsOf(el).every((s, i) => cls(s) === `star s${i + 1}` && !tagsOf(s).length);

function pageHero(el) {
  const section = cls(el);
  noAttrs(el, ['class']);
  const design = { section };
  let kids = tagsOf(el);
  if (kids.length === 2 && isStars(kids[0])) {
    design.stars = 'outside';
    kids = kids.slice(1);
  }
  const [content] = kids;
  if (kids.length !== 1) throw new Unsupported('hero children');
  expect(content, 'div', 'hero-content');
  let parts = tagsOf(content);
  if (parts[0] && isStars(parts[0])) {
    design.stars = 'inside';
    parts = parts.slice(1);
  }
  const [eyebrow, h1, line, text] = parts;
  if (parts.length !== 4) throw new Unsupported('hero parts');
  expect(eyebrow, 'p', 'small-heading');
  expect(noAttrs(h1), 'h1');
  expect(line, 'div', 'line');
  expect(text, 'p', 'hero-text');
  return { _type: 'pageHero', _key: key('ph'), design, eyebrow: textOf(eyebrow), title: lineOf(h1), text: textOf(text) };
}

function legalHero(el) {
  expect(el, 'section', 'privacy-hero');
  const [top, h1, line] = only(el, 3, 'legal hero');
  expect(top, 'div', 'privacy-top-line');
  const [s1, h5, s2] = only(top, 3, 'legal top line');
  [s1, s2].forEach((s) => expect(noAttrs(s), 'span'));
  expect(noAttrs(h5), 'h5');
  expect(noAttrs(h1), 'h1');
  expect(line, 'div', 'hero-line');
  return { _type: 'legalHero', _key: key('lh'), eyebrow: textOf(h5), title: textOf(h1) };
}

function legalContent(el) {
  expect(el, 'section', 'privacy-content');
  const kids = tagsOf(el);
  const b = { _type: 'legalContent', _key: key('lc'), clauses: [] };
  for (const [i, k] of kids.entries()) {
    if (i === 0 && k.name === 'p' && cls(k) === 'updated-text') {
      b.updated = textOf(k);
      continue;
    }
    expect(k, 'div', 'policy-block');
    const [h2, ...body] = tagsOf(k);
    expect(noAttrs(h2), 'h2');
    b.clauses.push({ _key: key('cl'), heading: textOf(h2), body: richOf({ children: k.children.slice(k.children.indexOf(h2) + 1) }) });
    if (!body.length) throw new Unsupported('empty clause');
  }
  return b;
}

function galleryFilters(el) {
  expect(el, 'section', 'filter-section');
  const [box] = only(el, 1, 'filters');
  expect(box, 'div', 'filter-buttons');
  return {
    _type: 'galleryFilters',
    _key: key('gf'),
    links: tagsOf(box).map((a) => {
      // /gallery's "ALL" was a malformed <button .=""> - made a normal link.
      if (a.name === 'button' && textOf(a) === 'ALL') return { _key: key('l'), label: 'ALL', href: '/gallery' };
      expect(a, 'a', 'filter-btn');
      noAttrs(a, ['class', 'href']);
      return { _key: key('l'), label: textOf(a), href: a.attribs.href };
    }),
  };
}

function galleryGrid(el) {
  expect(el, 'section', 'gallery-section');
  const [grid] = only(el, 1, 'gallery');
  expect(grid, 'div', 'gallery-grid');
  return {
    _type: 'galleryGrid',
    _key: key('gg'),
    photos: tagsOf(grid).map((it) => {
      expect(it, 'div', 'gallery-item');
      const [img] = only(it, 1, 'gallery item');
      expect(img, 'img');
      noAttrs(img, ['src', 'alt']);
      return { _key: key('ph'), src: img.attribs.src, alt: img.attribs.alt ?? '' };
    }),
  };
}

// ---- long-form article pages ------------------------------------------------

const SIMPLE = new Set(['p', 'h3', 'h4', 'ul', 'ol']);
const isSimple = (n) => n.type === 'tag' && SIMPLE.has(n.name) && !Object.keys(n.attribs).length;
const design = (el) => ({ tag: el.name, className: cls(el) || undefined });

function articleCards(el) {
  const cards = tagsOf(el);
  if (cards.length < 2) throw new Unsupported('cards: too few');
  const sigOf = (c) => `${c.name}.${cls(c)}`;
  if (new Set(cards.map(sigOf)).size !== 1) throw new Unsupported('cards: mixed');
  const partsSig = (c) => tagsOf(c).map(sigOf).join('|');
  if (new Set(cards.map(partsSig)).size !== 1) return freeCards(el, cards, sigOf);
  const first = tagsOf(cards[0]);
  if (first.length < 2 || first.length > 3) throw new Unsupported('cards: part count');
  // A part is one line (badge / title / text), a block of rich text (a
  // <div> holding a small heading, paragraphs, a list: "body"), a header row
  // (<div><span>01</span><h3>Title</h3></div>: "header" = badge + title) or a
  // bullet list ("list").
  const isBody = (p) => p.name === 'div' && !cls(p) && !(p.children ?? []).some((c) => c.type === 'text' && /\S/.test(c.data)) && (p.children ?? []).some((c) => c.type === 'tag') && (p.children ?? []).filter((c) => c.type === 'tag').every(isSimple);
  // Header row = first part only: a short label (<span>/<div>) then a heading.
  const els = (p) => (p.children ?? []).filter((c) => c.type === 'tag');
  const hasText = (p) => (p.children ?? []).some((c) => c.type === 'text' && /\S/.test(c.data));
  const isHeader = (p) => {
    const [b, t] = els(p);
    return p.name === 'div' && !hasText(p) && els(p).length === 2 && ['span', 'div'].includes(b.name) && /^h[2-5]$/.test(t.name) && inlineOnlyEl(b) && inlineOnlyEl(t);
  };
  const isList = (p) => (p.name === 'ul' || p.name === 'ol') && !hasText(p) && els(p).every((li) => li.name === 'li');
  const roleOf = (p, fallback) => (isList(p) ? 'list' : isBody(p) ? 'body' : fallback);
  const roles =
    first.length === 2 ? [isHeader(first[0]) ? 'header' : 'badge', roleOf(first[1], 'text')] : ['badge', 'title', roleOf(first[2], 'text')];
  return {
    _type: 'articleCards',
    _key: key('ac'),
    design: {
      ...design(el),
      cardTag: cards[0].name,
      cardClass: cls(cards[0]) || undefined,
      parts: first.map((p, i) => ({
        tag: p.name,
        className: cls(p) || undefined,
        role: roles[i],
        ...(roles[i] === 'header' ? { inner: tagsOf(p).map((x) => ({ tag: x.name, className: cls(x) || undefined })) } : {}),
      })),
    },
    cards: cards.map((c) => {
      const card = { _key: key('cd') };
      tagsOf(c).forEach((p, i) => {
        noAttrs(p, ['class']);
        if (roles[i] === 'body') card.body = richOf(p);
        else if (roles[i] === 'header') {
          const [b, t] = tagsOf(p);
          card.badge = lineOf(b);
          card.title = lineOf(t);
        } else if (roles[i] === 'list') card.items = tagsOf(p).map((li) => ({ _key: key('li'), text: lineOf(noAttrs(li)) }));
        else card[roles[i]] = lineOf(p);
      });
      return card;
    }),
  };
}

const elsOf = (el) => (el.children ?? []).filter((c) => c.type === 'tag');
const textIn = (el) => (el.children ?? []).some((c) => c.type === 'text' && /\S/.test(c.data));

const inlineOnlyEl = (el) => {
  try {
    inlineOf(el);
    return true;
  } catch (e) {
    if (e instanceof Unsupported) return false;
    throw e;
  }
};

/* Cards whose bodies differ (each starts with the same header row - number +
   title - then its own mix of paragraphs, sub-options, lists). */
function freeCards(el, cards, sigOf) {
  const heads = cards.map((c) => tagsOf(c)[0]);
  if (new Set(heads.map(sigOf)).size !== 1) throw new Unsupported('cards: parts differ');
  const h = heads[0];
  const [b, t] = tagsOf(h);
  if (tagsOf(h).length !== 2 || !/^h[2-5]$/.test(t.name)) throw new Unsupported('cards: no header row');
  return {
    _type: 'articleCards',
    _key: key('ac'),
    design: {
      ...design(el),
      cardTag: cards[0].name,
      cardClass: cls(cards[0]) || undefined,
      parts: [{ tag: h.name, className: cls(h) || undefined, role: 'header', inner: [b, t].map((x) => ({ tag: x.name, className: cls(x) || undefined })) }, { role: 'content' }],
    },
    cards: cards.map((c) => {
      const [hd, ...rest] = c.children.filter((n) => n.type !== 'comment' && !(n.type === 'text' && !/\S/.test(n.data)));
      const [bb, tt] = tagsOf(hd);
      return { _key: key('cd'), badge: lineOf(bb), title: lineOf(tt), content: contentOf(rest) };
    }),
  };
}

function articleItem(el) {
  // a.button, or <div class><a class/></div>
  if (el.name === 'a') {
    const newTab = el.attribs.target === '_blank';
    noAttrs(el, ['class', 'href', ...(newTab ? ['target', 'rel'] : [])]);
    return { _type: 'articleButton', _key: key('ab'), design: design(el), label: lineOf(el), href: el.attribs.href, newTab: newTab || undefined };
  }
  // A styled bullet list.
  if ((el.name === 'ul' || el.name === 'ol') && tagsOf(el).every((li) => li.name === 'li' && !Object.keys(li.attribs).length)) {
    noAttrs(el, ['class']);
    return { _type: 'articleList', _key: key('al'), design: design(el), items: tagsOf(el).map((li) => ({ _key: key('li'), text: lineOf(li) })) };
  }
  // A note made of one sentence with links / bold (no paragraphs).
  if (el.name === 'div' && inlineOnlyEl(el)) {
    noAttrs(el, ['class']);
    const { children, markDefs } = inlineOf(el);
    return { _type: 'articleBox', _key: key('ax'), design: design(el), body: [{ _type: 'block', _key: key('b'), style: 'plain', markDefs, children }] };
  }
  const kids = (el.children ?? []).filter((c) => c.type === 'tag');
  if ((el.children ?? []).some((c) => c.type === 'text' && /\S/.test(c.data))) throw new Unsupported('loose text');
  // <div class><img/></div>
  if (el.name === 'div' && kids.length === 1 && kids[0].name === 'img') {
    noAttrs(el, ['class']);
    noAttrs(kids[0], ['src', 'alt']);
    return { _type: 'articleImage', _key: key('ai'), design: design(el), picture: { src: kids[0].attribs.src, alt: kids[0].attribs.alt ?? '' } };
  }
  if (el.name === 'div' && kids.length === 1 && kids[0].name === 'a') {
    const a = kids[0];
    if (a.attribs.target !== '_blank') noAttrs(a, ['class', 'href']);
    const newTab = a.attribs.target === '_blank';
    if (newTab) noAttrs(a, ['class', 'href', 'target', 'rel']);
    return { _type: 'articleButton', _key: key('ab'), design: { ...design(a), wrapTag: el.name, wrapClass: cls(el) || undefined }, label: lineOf(a), href: a.attribs.href, newTab: newTab || undefined };
  }
  // <div.x-consultation-cta><div.x-cta-content><h3/>[<p/>]<a/></div></div>
  if (kids.length === 1 && [2, 3].includes(elsOf(kids[0]).length) && !textIn(kids[0])) {
    const parts = elsOf(kids[0]);
    const [h3, p, a] = parts.length === 3 ? parts : [parts[0], null, parts[1]];
    if (h3.name === 'h3' && (!p || p.name === 'p') && a.name === 'a') {
      noAttrs(h3);
      if (p) noAttrs(p);
      noAttrs(a, ['class', 'href']);
      return {
        _type: 'articleCallout',
        _key: key('ao'),
        design: { className: cls(el), innerClass: cls(kids[0]), buttonClass: cls(a) },
        heading: textOf(h3),
        text: p ? lineOf(p) : undefined,
        buttonLabel: textOf(a),
        buttonHref: a.attribs.href,
      };
    }
  }
  // Note with an icon: <div><div.icon>✦</div><p/>…</div>
  if (el.name === 'div' && kids.length >= 2 && kids[0].name === 'div' && !elsOf(kids[0]).length && textIn(kids[0]) && kids.slice(1).every(isSimple)) {
    noAttrs(el, ['class']);
    noAttrs(kids[0], ['class']);
    return {
      _type: 'articleNote',
      _key: key('an'),
      design: { ...design(el), iconClass: cls(kids[0]) || undefined },
      icon: textOf(kids[0]),
      body: richOf({ children: kids.slice(1) }),
    };
  }
  // Picture beside text: <div><div><img/></div><div><p/>…</div></div>
  if (el.name === 'div' && kids.length === 2 && elsOf(kids[0]).length === 1 && elsOf(kids[0])[0].name === 'img' && !textIn(kids[1]) && elsOf(kids[1]).every(isSimple)) {
    noAttrs(el, ['class']);
    const img = noAttrs(elsOf(kids[0])[0], ['src', 'alt']);
    return {
      _type: 'articleMedia',
      _key: key('am'),
      design: { ...design(el), imageClass: cls(kids[0]) || undefined, textClass: cls(kids[1]) || undefined },
      picture: { src: img.attribs.src, alt: img.attribs.alt ?? '' },
      body: richOf(kids[1]),
    };
  }
  try {
    return articleCards(el);
  } catch (e) {
    if (!(e instanceof Unsupported)) throw e;
  }
  // A box of plain text (note, intro text, list card).
  return { _type: 'articleBox', _key: key('ax'), design: design(noAttrs(el, ['class'])), body: richOf(el) };
}

/** Section / card content: runs of paragraphs, headings and lists become one
    "Text"; anything else is a card grid, list, box, picture or button. */
function contentOf(nodes) {
  const content = [];
  let run = [];
  const flush = () => {
    if (run.length) content.push({ _type: 'articleText', _key: key('at'), body: richOf({ children: run }) });
    run = [];
  };
  for (const n of nodes) {
    if (n.type === 'comment' || (n.type === 'text' && !/\S/.test(n.data))) continue;
    if (n.type === 'text') throw new Unsupported('loose text');
    if (isSimple(n)) run.push(n);
    else {
      flush();
      content.push(articleItem(n));
    }
  }
  flush();
  return content;
}

function articleSection(el) {
  noAttrs(el, ['class']);
  const sec = { _key: key('as'), design: design(el), content: [] };
  let nodes = el.children.filter((c) => c.type !== 'comment' && !(c.type === 'text' && !/\S/.test(c.data)));
  const first = nodes[0];
  if (first?.type === 'tag' && (first.name === 'span' || first.name === 'p') && /label|small|eyebrow/.test(cls(first))) {
    sec.label = textOf(first);
    sec.design.labelTag = first.name;
    sec.design.labelClass = cls(first);
    nodes = nodes.slice(1);
  }
  const h = nodes[0];
  if (h?.type === 'tag' && (h.name === 'h1' || h.name === 'h2')) {
    noAttrs(h, ['class']);
    sec.heading = lineOf(h);
    sec.design.headingTag = h.name;
    if (cls(h)) sec.design.headingClass = cls(h);
    nodes = nodes.slice(1);
  }
  sec.content = contentOf(nodes);
  return sec;
}

function article(el, $) {
  noAttrs(el, ['class']);
  const b = { _type: 'article', _key: key('ar'), design: design(el), sections: [] };
  let host = el;
  const kids = tagsOf(el);
  if (kids.length === 1 && /container/.test(cls(kids[0]))) {
    host = kids[0];
    b.design.innerTag = host.name;
    b.design.innerClass = cls(host);
  }
  for (const n of host.children) {
    if (n.type === 'comment' || (n.type === 'text' && !/\S/.test(n.data))) continue;
    if (n.type !== 'tag') throw new Unsupported('article loose text');
    try {
      b.sections.push(articleSection(n));
    } catch (e) {
      if (!(e instanceof Unsupported)) throw e;
      const c = customSection($, n, e.message);
      delete c._reason;
      b.sections.push(c);
      b._fallbacks = (b._fallbacks ?? 0) + 1;
      (b._why ??= []).push(`${cls(n)}: ${e.message}${process.env.PARSE_DEBUG ? " @ " + e.stack.split("\n").slice(1, 4).map((l) => l.trim().replace(/^at /, "").replace(/\(.*\/(\w[\w-]*\.mjs):(\d+).*\)/, "$1:$2")).join(" < ") : ""}`);
    }
  }
  return b;
}

// ---- home hero, reviews, treatments index, clinic pages, sitemap ------------

const picture = (img) => {
  expect(img, 'img');
  noAttrs(img, ['src', 'alt']);
  return { src: img.attribs.src, alt: img.attribs.alt ?? '' };
};
const empty = (el, tag, c) => {
  expect(el, tag, c);
  if (tagsOf(el).length) throw new Unsupported(`${c} not empty`);
  return el;
};

function homeHero(el) {
  expect(el, 'header', 'hero');
  const [overlay, particles, content] = only(el, 3, 'home hero');
  empty(overlay, 'div', 'hero-overlay');
  empty(particles, 'div', 'particles');
  expect(content, 'div', 'hero-content');
  const [eyebrow, h1, text, buttons, strip, stats] = only(content, 6, 'home hero content');
  expect(eyebrow, 'p', 'subheading');
  expect(noAttrs(h1), 'h1');
  expect(text, 'p', 'hero-text');
  expect(buttons, 'div', 'hero-buttons');
  const [a1, a2] = only(buttons, 2, 'hero buttons');
  expect(a1, 'a', 'primary-btn');
  expect(a2, 'a', 'secondary-btn');
  expect(strip, 'div', 'hero-contact-strip');
  const contacts = [];
  tagsOf(strip).forEach((c, i) => {
    if (i % 2) return empty(c, 'div', 'hero-contact-line');
    expect(c, 'div', 'hero-contact-item');
    const [span, a] = only(c, 2, 'hero contact');
    expect(noAttrs(span), 'span');
    expect(noAttrs(a, ['href']), 'a');
    if (!a.attribs.href.startsWith('tel:')) throw new Unsupported('hero contact href');
    contacts.push({ _key: key('hc'), label: textOf(span), phone: textOf(a), tel: a.attribs.href.slice(4) });
  });
  expect(stats, 'div', 'hero-stats');
  return {
    _type: 'homeHero',
    _key: key('hh'),
    eyebrow: textOf(eyebrow),
    title: lineOf(h1),
    text: textOf(text),
    primary: { label: textOf(noAttrs(a1, ['class', 'href'])), href: a1.attribs.href },
    secondary: { label: textOf(noAttrs(a2, ['class', 'href'])), href: a2.attribs.href },
    contacts,
    stats: tagsOf(stats).map((s) => {
      const [h3, p] = only(noAttrs(expect(s, 'div')), 2, 'stat');
      return { _key: key('st'), value: textOf(noAttrs(expect(h3, 'h3'))), label: textOf(noAttrs(expect(p, 'p'))) };
    }),
  };
}

function reviews(el) {
  expect(el, 'section', 'reviews-section');
  const [grid] = only(el, 1, 'reviews');
  expect(grid, 'div', 'reviews-grid');
  return {
    _type: 'reviews',
    _key: key('rv'),
    reviews: tagsOf(grid).map((card) => {
      expect(card, 'div', 'review-card');
      const [top, text, bottom] = only(card, 3, 'review');
      expect(top, 'div', 'review-top');
      const [stars, source] = only(top, 2, 'review top');
      expect(stars, 'div', 'stars');
      const s = textOf(stars);
      if (!/^★+$/.test(s)) throw new Unsupported('stars');
      expect(text, 'p', 'review-text');
      expect(bottom, 'div', 'review-bottom');
      const [name, small] = only(bottom, 2, 'review bottom');
      return {
        _key: key('r'),
        stars: s.length,
        source: textOf(noAttrs(expect(source, 'span'))),
        text: textOf(text),
        name: textOf(noAttrs(expect(name, 'h4'))),
        treatment: textOf(noAttrs(expect(small, 'small'))),
      };
    }),
  };
}

function treatmentCards(el) {
  expect(el, 'section', 'treatments-section');
  const [grid] = only(el, 1, 'treatments');
  expect(grid, 'div', 'treatments-grid');
  return {
    _type: 'treatmentCards',
    _key: key('tc'),
    cards: tagsOf(grid).map((card) => {
      expect(card, 'div', 'treatment-card');
      const [imgBox, content] = only(card, 2, 'treatment card');
      expect(imgBox, 'div', 'card-image');
      const [img] = only(imgBox, 1, 'card image');
      expect(content, 'div', 'card-content');
      const [h3, p, a] = only(content, 3, 'card content');
      return {
        _key: key('c'),
        picture: picture(img),
        title: textOf(noAttrs(expect(h3, 'h3'))),
        text: textOf(noAttrs(expect(p, 'p'))),
        linkLabel: textOf(noAttrs(expect(a, 'a'), ['href'])),
        href: a.attribs.href,
      };
    }),
  };
}

function clinicIntro(el) {
  expect(el, 'section', 'reviva-noida-sanctuary');
  const [wrap] = only(el, 1, 'clinic intro');
  expect(wrap, 'div', 'reviva-noida-wrapper');
  const [content, imgBox] = only(wrap, 2, 'clinic intro wrapper');
  expect(content, 'div', 'reviva-noida-content');
  const [tag, title, line, ...paras] = tagsOf(content);
  expect(tag, 'span', 'reviva-noida-tag');
  expect(title, 'h2', 'reviva-noida-title');
  empty(line, 'div', 'reviva-noida-line');
  if (!paras.every(isSimple)) throw new Unsupported('clinic intro text');
  expect(imgBox, 'div', 'reviva-noida-image-box');
  const [img] = only(imgBox, 1, 'clinic image');
  return { _type: 'clinicIntro', _key: key('ci'), tag: textOf(tag), title: lineOf(title), body: richOf({ children: paras }), picture: picture(img) };
}

function clinicGallery(el) {
  expect(el, 'section', 'reviva-gallery-sec');
  const [head, grid] = only(el, 2, 'clinic gallery');
  expect(head, 'div', 'reviva-gallery-head');
  const [span, h2] = only(head, 2, 'clinic gallery head');
  expect(grid, 'div', 'reviva-gallery-grid');
  const [big, side, b1, b2] = only(grid, 4, 'clinic gallery grid');
  expect(big, 'div', 'reviva-gallery-big');
  expect(side, 'div', 'reviva-gallery-side');
  const smalls = only(side, 2, 'gallery side').map((s) => expect(s, 'div', 'reviva-gallery-small'));
  [b1, b2].forEach((b) => expect(b, 'div', 'reviva-gallery-small-bottom'));
  const photos = [big, ...smalls, b1, b2].map((box) => ({ _key: key('cp'), ...picture(only(box, 1, 'gallery photo')[0]) }));
  return { _type: 'clinicGallery', _key: key('cg'), eyebrow: textOf(noAttrs(expect(span, 'span'))), heading: textOf(noAttrs(expect(h2, 'h2'))), photos };
}

function signatureTreatments(el) {
  expect(el, 'section', 'reviva-signature-wrap');
  const [head, grid] = only(el, 2, 'signature');
  expect(head, 'div', 'reviva-signature-heading');
  const [sub, h2] = only(head, 2, 'signature heading');
  expect(sub, 'span', 'reviva-signature-subtitle');
  expect(noAttrs(h2), 'h2');
  expect(grid, 'div', 'reviva-signature-grid');
  return {
    _type: 'signatureTreatments',
    _key: key('sg'),
    eyebrow: textOf(sub),
    title: lineOf(h2),
    cards: tagsOf(grid).map((card, i) => {
      expect(card, 'div', 'reviva-treatment-card');
      const [n, h3, p] = only(card, 3, 'signature card');
      expect(n, 'span', 'reviva-treatment-number');
      if (textOf(n) !== String(i + 1).padStart(2, '0')) throw new Unsupported('signature numbering');
      return { _key: key('s'), title: textOf(noAttrs(expect(h3, 'h3'))), text: textOf(noAttrs(expect(p, 'p'))) };
    }),
  };
}

function linkGroups(el) {
  expect(el, 'div', 'sitemap-container');
  const [h1, ...sections] = tagsOf(el);
  expect(noAttrs(h1), 'h1');
  return {
    _type: 'linkGroups',
    _key: key('lg'),
    title: textOf(h1),
    groups: sections.map((s) => {
      expect(s, 'div', 'sitemap-section');
      const [h2, links] = only(s, 2, 'sitemap section');
      expect(links, 'div', 'sitemap-links');
      return {
        _key: key('g'),
        heading: textOf(noAttrs(expect(h2, 'h2'))),
        links: tagsOf(links).map((a) => ({ _key: key('l'), label: textOf(noAttrs(expect(a, 'a'), ['href'])), href: a.attribs.href })),
      };
    }),
  };
}

function contactSection(el) {
  expect(el, 'section', 'contact-section');
  const [box, maps] = only(el, 2, 'contact');
  expect(box, 'div', 'contact-container');
  const [formWrap, info] = only(box, 2, 'contact container');
  expect(formWrap, 'div', 'contact-form-wrapper');
  const [h2, form] = only(formWrap, 2, 'contact form wrapper');
  expect(form, 'form', 'contact-form');
  const label = (name) => {
    const field = (form.children ?? []).length && cheerioFind(form, (n) => n.attribs?.name === name);
    const group = field?.parent;
    const lab = group && elsOf(group).find((c) => c.name === 'label');
    return lab ? textOf(lab) : undefined;
  };
  const select = cheerioFind(form, (n) => n.name === 'select');
  const button = cheerioFind(form, (n) => n.name === 'button');
  expect(info, 'div', 'contact-info');
  const [infoTitle, ...boxes] = tagsOf(info);
  expect(maps, 'div', 'map-grid');
  return {
    _type: 'contactSection',
    _key: key('cs'),
    formTitle: textOf(h2),
    labels: { name: label('full_name'), phone: label('phone'), email: label('email'), concern: label('concern'), message: label('message') },
    concerns: elsOf(select).map((o) => textOf(o)),
    buttonLabel: textOf(button),
    infoTitle: textOf(infoTitle),
    details: boxes.map((bx) => {
      expect(bx, 'div', 'info-box');
      const [icon, body] = only(bx, 2, 'info box');
      const [span, value, note] = tagsOf(body);
      return {
        _key: key('cd'),
        icon: textOf(icon),
        color: cls(icon).split(/\s+/)[1] || 'gold',
        label: textOf(span),
        value: textOf(value),
        href: value.name === 'a' ? value.attribs.href : undefined,
        note: note ? textOf(note) : undefined,
      };
    }),
    maps: tagsOf(maps).map((m) => {
      expect(m, 'div', 'map-box');
      const [f] = only(m, 1, 'map');
      expect(f, 'iframe');
      return { _key: key('mp'), title: f.attribs.title, embedUrl: f.attribs.src };
    }),
  };
}
const cheerioFind = (root, test) => {
  for (const c of root.children ?? []) {
    if (c.type !== 'tag') continue;
    if (test(c)) return c;
    const f = cheerioFind(c, test);
    if (f) return f;
  }
  return null;
};

/** The /blogs grid is generated from the blog posts. */
function postGrid(el) {
  expect(el, 'section', 'blog-section');
  return { _type: 'postGrid', _key: key('pg') };
}

// ---- dispatch ---------------------------------------------------------------

const PARSERS = {
  'rv-shero': serviceHero,
  'rv-svc': serviceOverview,
  'procedure-section': procedure,
  'results-section': beforeAfter,
  'results-strip': beforeAfter,
  'faq-section': faq,
  'reviva-faq-wrap': faq,
  'rv-endcta': ctaBanner,
  heo: banner,
  hro: banner,
  her: banner,
  'about-hero': pageHero,
  'blog-hero': pageHero,
  'contact-hero': pageHero,
  'reviews-hero': pageHero,
  'treatments-hero': pageHero,
  'gallery-hero': pageHero,
  'privacy-hero': legalHero,
  'privacy-content': legalContent,
  'filter-section': galleryFilters,
  'gallery-section': galleryGrid,
  'dermatologist-content': article,
  'aboutreviva-content': article,
  'acnescar-content': article,
  'acne-content': article,
  'hifu-content': article,
  'hydrafacial-content': article,
  'lhr-content': article,
  'pigmentation-content': article,
  hero: homeHero,
  'reviews-section': reviews,
  'treatments-section': treatmentCards,
  'reviva-noida-sanctuary': clinicIntro,
  'reviva-gallery-sec': clinicGallery,
  'reviva-signature-wrap': signatureTreatments,
  'sitemap-container': linkGroups,
  'blog-section': postGrid,
  'contact-section': contactSection,
};
export const registerParser = (className, fn) => (PARSERS[className] = fn);

const titleCase = (s) => s.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());

/** A section kept as its original layout, its text and pictures as fields grouped by sub-block. */
export function customSection($, el, reason, title) {
  const { template, sections } = extractFields($.html(el));
  const heading = $(el).find('h1,h2,h3').first().text().replace(/\s+/g, ' ').trim();
  return {
    _type: 'customSection',
    _key: key('x'),
    title: title || heading.slice(0, 80) || titleCase((cls(el).split(/\s+/)[0] || el.name).replace(/[-_]+/g, ' ')),
    templateHtml: template,
    groups: sections,
    _reason: reason,
  };
}

/**
 * Page body -> { blocks, scrim, whatsapp, scriptsHtml }. `scrim` / `whatsapp`
 * mark the site-wide overlay div and floating WhatsApp button, which the page
 * layout renders itself; `scriptsHtml` holds the page's own inline scripts.
 */
export function parsePage(html) {
  const $ = cheerio.load(html, null, false);
  const out = { blocks: [], scrim: false, whatsapp: false, scriptsHtml: '', report: [] };
  for (const node of $.root().contents().toArray()) {
    if (node.type === 'comment' || (node.type === 'text' && !/\S/.test(node.data))) continue;
    if (node.type === 'tag' && node.name === 'br') {
      out.blocks.push({ _type: 'spacer', _key: key('br') });
      continue;
    }
    if (node.type === 'tag' && cls(node) === 'rv-scrim' && !tagsOf(node).length) {
      out.scrim = true;
      continue;
    }
    // Page scripts / styles are not content: kept in a hidden field and
    // rendered after the page body.
    if (node.type === 'script' || node.type === 'style' || (node.type === 'tag' && (node.name === 'script' || node.name === 'style'))) {
      out.scriptsHtml += $.html(node) + '\n';
      continue;
    }
    if (node.type === 'tag' && cls(node) === 'whatsapp-btn') {
      out.whatsapp = true;
      continue;
    }
    if (node.type !== 'tag') {
      out.blocks.push(customSection($, $('<div></div>').append(node)[0], 'loose text'));
      continue;
    }
    const parser = PARSERS[cls(node).split(/\s+/)[0]];
    if (!parser) {
      out.blocks.push(customSection($, node, 'no component'));
      out.report.push(`custom: ${cls(node) || node.name}`);
      continue;
    }
    try {
      out.blocks.push(parser(node, $));
    } catch (e) {
      if (!(e instanceof Unsupported)) throw e;
      out.blocks.push(customSection($, node, e.message));
      out.report.push(`fallback ${cls(node).split(/\s+/)[0]}: ${e.message}`);
    }
  }
  return out;
}
