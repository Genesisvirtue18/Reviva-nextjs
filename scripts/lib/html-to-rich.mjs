/*
 * Old-site HTML -> Sanity rich text (Portable Text), the reverse of
 * lib/rich.tsx. Converters throw `Unsupported` for markup they cannot
 * represent faithfully; callers then keep that part as a fixed layout.
 */
export class Unsupported extends Error {}

const INLINE = new Set(['a', 'span', 'strong', 'b', 'em', 'i', 'u', 'br', 'time', 'small', 'sup', 'sub', 'mark', 'abbr', 'cite', 'q', 's', 'del', 'ins', 'font', 'code', 'label']);
const DECORATOR = { strong: 'strong', b: 'strong', em: 'em', i: 'em', u: 'underline', span: 'highlight' };
const P_CLASS_STYLE = { 'center-text': 'center', highlight: 'highlight', 'center-line': 'centerLine' };

let keyN = 0;
export const key = (p = 'k') => `${p}${(keyN++).toString(36)}`;


/** Inline children of an element -> { children, markDefs } (whitespace collapsed like a browser). */
export function inlineOf(el, { trim = true } = {}) {
  const markDefs = [];
  const children = [];
  const push = (text, marks) => {
    const last = children[children.length - 1];
    if (last && last.marks.join() === marks.join()) last.text += text;
    else children.push({ _type: 'span', _key: key('s'), text, marks: [...marks] });
  };
  const walk = (node, marks) => {
    if (node.type === 'text') return push(node.data.replace(/\s+/g, ' '), marks);
    if (node.type === 'comment') return;
    if (node.type !== 'tag') throw new Unsupported(`inline ${node.type}`);
    if (node.name === 'br') return push('\n', marks);
    if (!INLINE.has(node.name)) throw new Unsupported(`inline <${node.name}>`);
    let mark;
    const attrs = Object.keys(node.attribs);
    if (DECORATOR[node.name] && !attrs.length) mark = DECORATOR[node.name];
    else if (node.name === 'span' && attrs.length === 1 && node.attribs.class === 'highlight-name') mark = 'nameHighlight';
    else if (node.name === 'a') {
      if (attrs.some((a) => !['href', 'target', 'rel'].includes(a))) throw new Unsupported(`link with ${attrs.join(',')}`);
      mark = key('m');
      markDefs.push({ _type: 'link', _key: mark, href: node.attribs.href ?? '', ...(node.attribs.target === '_blank' ? { newTab: true } : {}) });
    } else throw new Unsupported(`styled <${node.name} ${attrs.join(',')}>`);
    if (!node.children.length) throw new Unsupported(`empty <${node.name}>`);
    node.children.forEach((c) => walk(c, [...marks, mark]));
  };
  (el.children ?? []).forEach((c) => walk(c, []));

  let prevSpace = trim;
  for (const c of children) {
    c.text = c.text.replace(/ ?\n ?/g, '\n');
    if (prevSpace) c.text = c.text.replace(/^ /, '');
    prevSpace = / $|\n$/.test(c.text) || (prevSpace && c.text === '');
  }
  if (trim) {
    for (let i = children.length - 1; i >= 0; i--) {
      children[i].text = children[i].text.replace(/ $/, '');
      if (children[i].text) break;
    }
  }
  const kept = children.filter((c) => c.text !== '');
  const used = new Set(kept.flatMap((c) => c.marks));
  return { children: kept.length ? kept : [{ _type: 'span', _key: key('s'), text: '', marks: [] }], markDefs: markDefs.filter((d) => used.has(d._key)) };
}

/** A plain string field: text + <br> only (no formatting). */
export function textOf(el) {
  const { children, markDefs } = inlineOf(el);
  if (markDefs.length || children.some((c) => c.marks.length)) throw new Unsupported('formatted text in a plain field');
  return children.map((c) => c.text).join('');
}

const block = (style, inline, extra = {}) => ({ _type: 'block', _key: key('b'), style, ...extra, markDefs: inline.markDefs, children: inline.children });

/** One paragraph-like element -> one rich-text block (style from tag/class). */
export function blockOf(el) {
  const cls = el.attribs?.class;
  let style;
  if (el.name === 'p') style = cls ? P_CLASS_STYLE[cls] : 'normal';
  else if (/^h[2-5]$/.test(el.name) && !cls) style = el.name;
  if (!style || Object.keys(el.attribs).some((a) => a !== 'class')) throw new Unsupported(`<${el.name}${cls ? '.' + cls : ''}>`);
  return block(style, inlineOf(el));
}

/** The children of a container -> a rich-text body. */
export function richOf(container) {
  const out = [];
  for (const node of container.children ?? []) {
    if (node.type === 'comment') continue;
    if (node.type === 'text') {
      if (/\S/.test(node.data)) out.push(block('plain', inlineOf({ children: [node] })));
      continue;
    }
    if (node.type !== 'tag') throw new Unsupported(node.type);
    if (node.name === 'br') out.push(block('spacer', { children: [{ _type: 'span', _key: key('s'), text: '', marks: [] }], markDefs: [] }));
    else if (node.name === 'ul' || node.name === 'ol') {
      if (Object.keys(node.attribs).length) throw new Unsupported(`<${node.name} attrs>`);
      for (const li of node.children) {
        if (li.type === 'text' && !/\S/.test(li.data)) continue;
        if (li.type !== 'tag' || li.name !== 'li' || Object.keys(li.attribs).length) throw new Unsupported('list content');
        out.push(block('normal', inlineOf(li), { listItem: node.name === 'ol' ? 'number' : 'bullet', level: 1 }));
      }
    } else if (node.name === 'img') {
      out.push({ _type: 'figure', _key: key('f'), src: node.attribs.src ?? '', alt: node.attribs.alt ?? '', className: node.attribs.class });
    } else out.push(blockOf(node));
  }
  return out;
}

/** Element children that are tags (skipping whitespace/comments); throws on loose text. */
export function tagsOf(el) {
  const out = [];
  for (const c of el.children ?? []) {
    if (c.type === 'tag') out.push(c);
    else if (c.type === 'text' && /\S/.test(c.data)) throw new Unsupported('loose text');
  }
  return out;
}

/** Asserts an element is <tag class="...">, returning it. */
export function expect(el, tag, cls) {
  if (!el || el.type !== 'tag' || el.name !== tag || (cls !== undefined && (el.attribs.class ?? '') !== cls)) {
    throw new Unsupported(`expected <${tag}${cls ? '.' + cls : ''}> got <${el?.name}${el?.attribs?.class ? '.' + el.attribs.class : ''}>`);
  }
  return el;
}
