import { createElement, Fragment, type ReactNode } from 'react';
import { pictureSrc, type Picture } from './image';

/* Sanity rich text (Portable Text) -> React, written for this site's markup:
   paragraph styles map to the original tags/classes, links and "styled"
   annotations keep the attributes they had on the old site, and "\n" inside
   a text span is a <br>. The reverse direction (HTML -> rich text) lives in
   scripts/lib/html-to-rich.mjs. */

export type Span = { _type: 'span'; _key: string; text: string; marks?: string[] };
export type MarkDef = { _key: string; _type: 'link' | 'styled'; href?: string; tag?: string; attrs?: string };
export type Block = {
  _type: 'block';
  _key: string;
  style?: string;
  listItem?: 'bullet' | 'number';
  level?: number;
  markDefs?: MarkDef[];
  children?: (Span | { _type: string; _key: string; html?: string })[];
};
export type Figure = Picture & { _type: 'figure'; _key: string; className?: string };
export type RichValue = (Block | Figure | { _type: string; _key: string })[];

const DECORATOR: Record<string, string> = { strong: 'strong', em: 'em', underline: 'u' };

/** Block styles -> element + class (the old site's paragraph variants). */
export const STYLE_TAG: Record<string, { tag: string; className?: string }> = {
  normal: { tag: 'p' },
  h2: { tag: 'h2' },
  h3: { tag: 'h3' },
  h4: { tag: 'h4' },
  h5: { tag: 'h5' },
  center: { tag: 'p', className: 'center-text' },
  highlight: { tag: 'p', className: 'highlight' },
  centerLine: { tag: 'p', className: 'center-line' },
};

const camel = (s: string) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/** Old-site attribute JSON ({"class":"x","style":"color:red"}) -> React props. */
export function attrsToProps(json?: string, override: Record<string, string | undefined> = {}) {
  let attrs: Record<string, string> = {};
  try {
    attrs = json ? JSON.parse(json) : {};
  } catch {}
  const props: Record<string, unknown> = {};
  for (const [k, v] of Object.entries({ ...attrs, ...override })) {
    if (v === undefined) continue;
    if (k === 'class') props.className = v;
    else if (k === 'for') props.htmlFor = v;
    else if (k === 'style')
      props.style = Object.fromEntries(
        v
          .split(';')
          .map((d) => d.split(':'))
          .filter(([p, val]) => p?.trim() && val !== undefined)
          .map(([p, ...val]) => [p.trim().startsWith('--') ? p.trim() : camel(p.trim()), val.join(':').trim()]),
      );
    else if (k === 'tabindex') props.tabIndex = v;
    else props[k] = v;
  }
  return props;
}

const textWithBreaks = (text: string, key: string): ReactNode =>
  text.includes('\n') ? text.split('\n').flatMap((part, i) => (i ? [<br key={`${key}b${i}`} />, part] : [part])) : text;

/** The inline content of one block (spans + marks) as React nodes. */
export function Inline({ block }: { block: Pick<Block, 'children' | 'markDefs'> }) {
  const defs = new Map((block.markDefs ?? []).map((d) => [d._key, d]));
  const wrap = (mark: string, children: ReactNode, key: string): ReactNode => {
    if (DECORATOR[mark]) return createElement(DECORATOR[mark], { key }, children);
    const d = defs.get(mark);
    if (!d) return children;
    if (d._type === 'link') return createElement('a', { key, ...attrsToProps(d.attrs, { href: d.href ?? '' }) }, children);
    return createElement(d.tag || 'span', { key, ...attrsToProps(d.attrs) }, children);
  };

  // Group neighbouring spans that share a mark so <a>One <strong>two</strong></a> stays one link.
  const render = (kids: Span[], depth: number, keyBase: string): ReactNode[] => {
    const out: ReactNode[] = [];
    let i = 0;
    while (i < kids.length) {
      const mark = kids[i].marks?.[depth];
      if (!mark) {
        out.push(<Fragment key={`${keyBase}${i}`}>{textWithBreaks(kids[i].text, `${keyBase}${i}`)}</Fragment>);
        i++;
        continue;
      }
      let j = i;
      while (j < kids.length && kids[j].marks?.[depth] === mark) j++;
      out.push(wrap(mark, render(kids.slice(i, j), depth + 1, `${keyBase}${i}-`), `${keyBase}${i}m`));
      i = j;
    }
    return out;
  };

  const spans = (block.children ?? []).filter((c): c is Span => c._type === 'span');
  return <>{render(spans, 0, 'k')}</>;
}

/** A whole rich-text body: paragraphs, headings, lists, figures. */
export function Rich({ value }: { value?: RichValue }) {
  const blocks = value ?? [];
  const out: ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b._type === 'figure') {
      const f = b as Figure;
      out.push(<img key={f._key} src={pictureSrc(f)} alt={f.alt ?? ''} className={f.className} />);
      continue;
    }
    if (b._type !== 'block') continue;
    const block = b as Block;
    if (block.listItem) {
      const type = block.listItem;
      const items: Block[] = [];
      while (i < blocks.length && (blocks[i] as Block).listItem === type) items.push(blocks[i++] as Block);
      i--;
      out.push(
        createElement(
          type === 'number' ? 'ol' : 'ul',
          { key: block._key },
          items.map((it) => (
            <li key={it._key}>
              <Inline block={it} />
            </li>
          )),
        ),
      );
      continue;
    }
    if (block.style === 'spacer') {
      out.push(<br key={block._key} />);
      continue;
    }
    if (block.style === 'plain') {
      out.push(
        <Fragment key={block._key}>
          <Inline block={block} />
        </Fragment>,
      );
      continue;
    }
    const { tag, className } = STYLE_TAG[block.style ?? 'normal'] ?? STYLE_TAG.normal;
    out.push(createElement(tag, { key: block._key, className }, <Inline block={block} />));
  }
  return <>{out}</>;
}

/** A plain text field where line breaks are <br>s. */
export function Lines({ text }: { text?: string }) {
  return <>{textWithBreaks(text ?? '', 'l')}</>;
}
