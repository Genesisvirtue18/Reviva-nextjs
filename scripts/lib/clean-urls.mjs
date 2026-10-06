/*
 * Clean URLs: the old static site's addresses ("/about.html",
 * "blog/x.html", "../acne.html", "https://revivaskinandsurgery.com/a.html")
 * become Next.js routes ("/about", "/blog/x"). Old addresses keep working
 * through the 301s in proxy.ts.
 */
import path from 'node:path';

const SITE = /^https?:\/\/(www\.)?revivaskinandsurgery\.com/i;

/** "/About.html" -> "/about", "/index.html" -> "/", "/lp/x/index.html" -> "/lp/x". */
export const cleanPath = (p) => {
  if (!/\.html$/i.test(p)) return p;
  const out = p.replace(/\/index\.html$/i, '').replace(/\.html$/i, '').toLowerCase();
  return out || '/';
};

// Clean paths of the pages that exist. When set, a relative link that
// resolves to a missing page ("acne.html" on a blog post -> /blog/acne) is
// pointed at the existing page of that name (/acne) instead.
let known = null;
export const setKnownPaths = (paths) => (known = new Set(paths));

/** One link, resolved against the page it sits on (its path, old or new form). */
export function cleanHref(href, pagePath = '/') {
  if (typeof href !== 'string' || !/\.html/i.test(href)) return href;
  if (/^(mailto:|tel:|#|javascript:|data:)/i.test(href)) return href;
  const site = href.match(SITE);
  if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(href) && !site) return href; // another website
  const rest = site ? href.slice(site[0].length) || '/' : href;
  const m = rest.match(/^([^?#]*)(.*)$/);
  let p = m[1];
  if (!p.startsWith('/')) p = path.posix.resolve(path.posix.dirname(pagePath.endsWith('/') ? `${pagePath}x` : pagePath), p);
  let clean = cleanPath(p);
  if (known && !known.has(clean) && /\.html$/i.test(p)) {
    const top = `/${clean.split('/').pop()}`;
    if (known.has(top)) clean = top;
  }
  const cleaned = clean + m[2];
  return site ? site[0] + cleaned : cleaned;
}

/** Every link inside a chunk of HTML (attributes, and site URLs inside scripts / JSON-LD). */
export function cleanHtml(html, pagePath = '/') {
  if (typeof html !== 'string' || !/\.html/i.test(html)) return html;
  return html
    .replace(/\b(href|action|content|data-href)=(["'])(.*?)\2/gi, (all, attr, q, v) => `${attr}=${q}${cleanHref(v, pagePath)}${q}`)
    .replace(/https?:\/\/(www\.)?revivaskinandsurgery\.com\/[^\s"'<>\\]*?\.html/gi, (u) => cleanHref(u, pagePath));
}

const HREF_KEYS = new Set(['href', 'bookUrl', 'buttonHref', 'destination']);
const HTML_KEYS = new Set(['code', 'html', 'contentHtml', 'headHtml', 'bodyStartHtml', 'bodyEndHtml']);

/** Deep-cleans a Sanity document / JSON value. `pagePath` resolves relative links. */
export function cleanValue(value, pagePath = '/', key = '') {
  if (Array.isArray(value)) return value.map((v) => cleanValue(v, pagePath));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, cleanValue(v, pagePath, k)]));
  }
  if (typeof value !== 'string') return value;
  if (HREF_KEYS.has(key)) return cleanHref(value, pagePath);
  if (HTML_KEYS.has(key)) return cleanHtml(value, pagePath);
  if (key === 'attrs') {
    try {
      const a = JSON.parse(value);
      if (a.href) a.href = cleanHref(a.href, pagePath);
      return JSON.stringify(a);
    } catch {
      return value;
    }
  }
  return value;
}
