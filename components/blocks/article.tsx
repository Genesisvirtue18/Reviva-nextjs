import { createElement } from 'react';
import { Inline, Rich, type Block, type RichValue } from '@/lib/rich';
import { renderFields } from '@/lib/render-fields';
import type { PageSection } from '@/lib/types';
import { pictureSrc, type Picture } from '@/lib/image';

/* Long-form treatment / clinic pages (Home article, About, Acne, HIFU...).
   An article is a list of sections; each section has an optional small
   label and heading, then content pieces: text, cards, highlighted boxes,
   buttons. Every page keeps its own class names (hifu-…, acne-…) in the
   hidden `design` objects, so its stylesheet applies unchanged. */

type Design = { tag?: string; className?: string };
type CardPart = { tag: string; className?: string; role: 'badge' | 'title' | 'text' | 'body' };

export type ArticleItem =
  | { _type: 'articleText'; _key: string; body?: RichValue }
  | { _type: 'articleBox'; _key: string; design?: Design; body?: RichValue }
  | {
      _type: 'articleCards';
      _key: string;
      design?: Design & { cardTag?: string; cardClass?: string; parts?: CardPart[] };
      cards?: { _key: string; badge?: RichValue; title?: RichValue; text?: RichValue; body?: RichValue }[];
    }
  | { _type: 'articleList'; _key: string; design?: Design; items?: { _key: string; text?: RichValue }[] }
  | { _type: 'articleImage'; _key: string; design?: Design; picture?: Picture }
  | { _type: 'articleButton'; _key: string; design?: Design & { wrapTag?: string; wrapClass?: string }; label?: string; href?: string; newTab?: boolean }
  | {
      _type: 'articleCallout';
      _key: string;
      design?: { className?: string; innerClass?: string; buttonClass?: string };
      heading?: string;
      text?: RichValue;
      buttonLabel?: string;
      buttonHref?: string;
    };

export type ArticleSection = {
  _key: string;
  design?: Design & { labelTag?: string; labelClass?: string; headingTag?: string; headingClass?: string };
  label?: string;
  heading?: RichValue;
  content?: ArticleItem[];
};
export type ArticleBlock = { _type: 'article'; _key: string; design?: Design & { innerTag?: string; innerClass?: string }; sections?: (ArticleSection | CustomPart)[] };
type CustomPart = { _type: 'customSection'; _key: string; templateHtml?: string; groups?: PageSection[] };

const Line = ({ value }: { value?: RichValue }) => {
  const block = value?.find((b) => b._type === 'block') as Block | undefined;
  return block ? <Inline block={block} /> : null;
};

function Item({ it }: { it: ArticleItem }) {
  switch (it._type) {
    case 'articleText':
      return <Rich value={it.body} />;
    case 'articleBox':
      return createElement(it.design?.tag ?? 'div', { className: it.design?.className }, <Rich value={it.body} />);
    case 'articleCards': {
      const d = it.design ?? {};
      return createElement(
        d.tag ?? 'div',
        { className: d.className },
        (it.cards ?? []).map((c) =>
          createElement(
            d.cardTag ?? 'div',
            { className: d.cardClass, key: c._key },
            (d.parts ?? []).map((p, i) =>
              createElement(p.tag, { className: p.className, key: i }, p.role === 'body' ? <Rich value={c.body} /> : <Line value={c[p.role]} />),
            ),
          ),
        ),
      );
    }
    case 'articleList':
      return createElement(
        it.design?.tag ?? 'ul',
        { className: it.design?.className },
        (it.items ?? []).map((li) => (
          <li key={li._key}>
            <Line value={li.text} />
          </li>
        )),
      );
    case 'articleImage':
      return createElement(it.design?.tag ?? 'div', { className: it.design?.className }, <img src={pictureSrc(it.picture)} alt={it.picture?.alt ?? ''} />);
    case 'articleButton': {
      const d = it.design ?? {};
      const a = (
        <a className={d.className} href={it.href} {...(it.newTab ? { target: '_blank', rel: 'noopener' } : {})}>
          {it.label}
        </a>
      );
      return d.wrapTag ? createElement(d.wrapTag, { className: d.wrapClass }, a) : a;
    }
    case 'articleCallout': {
      const d = it.design ?? {};
      return (
        <div className={d.className}>
          <div className={d.innerClass}>
            <h3>{it.heading}</h3>
            <p>
              <Line value={it.text} />
            </p>
            <a className={d.buttonClass} href={it.buttonHref}>
              {it.buttonLabel}
            </a>
          </div>
        </div>
      );
    }
  }
}

export function Article({ b }: { b: ArticleBlock }) {
  const sections = (b.sections ?? []).map((s) => {
      if ('_type' in s && s._type === 'customSection') {
        // A section with a one-off design: fixed layout, text/image fields.
        return <div key={s._key} style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: renderFields(s.templateHtml ?? '', s.groups) }} />;
      }
      const sec = s as ArticleSection;
      const d = sec.design ?? {};
      return createElement(
        d.tag ?? 'div',
        { className: d.className, key: sec._key },
        sec.label ? createElement(d.labelTag ?? 'span', { className: d.labelClass }, sec.label) : null,
        sec.heading ? createElement(d.headingTag ?? 'h2', { className: d.headingClass }, <Line value={sec.heading} />) : null,
        (sec.content ?? []).map((it) => <Item it={it} key={it._key} />),
      );
  });
  const d = b.design ?? {};
  const inner = d.innerClass ? createElement(d.innerTag ?? 'div', { className: d.innerClass }, sections) : sections;
  return createElement(d.tag ?? 'section', { className: d.className }, inner);
}
