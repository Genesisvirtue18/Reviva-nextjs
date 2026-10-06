import { createElement, Fragment, type ReactNode } from 'react';
import * as cheerio from 'cheerio';

/* Turns stored <head> / body-edge HTML (meta, link, script, style...) into real
   React elements so they land inside <head> in their original order. Inline
   <script>/<style> bodies are passed through untouched. */

const ATTR_MAP: Record<string, string> = {
  class: 'className',
  charset: 'charSet',
  crossorigin: 'crossOrigin',
  'http-equiv': 'httpEquiv',
  referrerpolicy: 'referrerPolicy',
  fetchpriority: 'fetchPriority',
  nomodule: 'noModule',
  itemprop: 'itemProp',
  hreflang: 'hrefLang',
};
const BOOLEAN = new Set(['async', 'defer', 'nomodule']);
const ALLOWED = new Set(['meta', 'link', 'script', 'style', 'noscript', 'base']);

export default function RawTags({ html }: { html?: string }) {
  if (!html) return null;
  const $ = cheerio.load(`<head>${html}</head>`, null, true);
  const out: ReactNode[] = [];

  // The parser may move tags it doesn't allow in <head> into <body>; take both.
  $('head > *, body > *')
    .each((i, el) => {
      if (el.type !== 'tag' && el.type !== 'script' && el.type !== 'style') return;
      const tag = el.tagName.toLowerCase();
      if (!ALLOWED.has(tag)) return;

      const props: Record<string, unknown> = { key: i };
      for (const [name, value] of Object.entries(el.attribs)) {
        const n = name.toLowerCase();
        props[ATTR_MAP[n] ?? n] = BOOLEAN.has(n) ? true : value;
      }
      const inner = $(el).html();
      if (inner && (tag === 'script' || tag === 'style' || tag === 'noscript')) {
        props.dangerouslySetInnerHTML = { __html: inner };
      }
      out.push(createElement(tag, props));
    });

  return createElement(Fragment, null, ...out);
}
