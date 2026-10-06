/*
 * One-off migration: reads the old static site (public_html) and writes one
 * JSON document per page into content/pages/. Markup is sliced out of the
 * original files as raw strings - never re-serialised - so the rendered HTML
 * is byte-for-byte what the old site served.
 *
 *   node scripts/extract-html.mjs ../public_html
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(process.argv[2] || '../public_html');
const OUT = path.resolve('content/pages');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const files = [
  ...fs.readdirSync(SRC).filter((f) => f.endsWith('.html')).map((f) => f),
  ...fs.readdirSync(path.join(SRC, 'blog')).filter((f) => f.endsWith('.html')).map((f) => `blog/${f}`),
];

const between = (s, startRe, endStr) => {
  const m = startRe.exec(s);
  if (!m) return null;
  const from = m.index + m[0].length;
  const to = s.indexOf(endStr, from);
  return to === -1 ? null : { inner: s.slice(from, to), open: m[0], start: m.index, end: to + endStr.length, from, to };
};

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");

let problems = 0;
for (const file of files) {
  const html = fs.readFileSync(path.join(SRC, file), 'utf8');

  const head = between(html, /<head[^>]*>/i, '</head>');
  const body = between(html, /<body[^>]*>/i, '</body>');
  if (!head || !body) { console.warn('SKIP (no head/body):', file); problems++; continue; }

  let headHtml = head.inner;
  const titleM = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(headHtml);
  const descM = /<meta\s+name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i.exec(headHtml);
  // Next.js emits charset + viewport itself (identical values), and the title
  // and description become editable fields - strip them from the raw head.
  headHtml = headHtml
    .replace(/<title[^>]*>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name=["']description["'][^>]*>/i, '')
    .replace(/<meta\s+charset=[^>]*>/gi, '')
    .replace(/<meta\s+name=["']viewport["'][^>]*>/gi, '');

  const b = body.inner;
  const hStart = b.search(/<header class="rv-header"/);
  const hEnd = hStart === -1 ? -1 : b.indexOf('</header>', hStart) + '</header>'.length;
  const fStart = b.search(/<footer class="rv-footer"/);
  const fEnd = fStart === -1 ? -1 : b.indexOf('</footer>', fStart) + '</footer>'.length;
  if (hStart === -1 || fStart === -1 || fStart < hEnd) { console.warn('SKIP (header/footer):', file); problems++; continue; }

  const bodyClass = (/class=["']([^"']*)["']/i.exec(body.open) || [])[1] || '';
  const route = file === 'index.html' ? '/' : `/${file}`;
  const id = 'page-' + (route === '/' ? 'home' : route.slice(1).replace(/\.html$/, '').replace(/[^a-zA-Z0-9-]/g, '-'));

  const doc = {
    _id: id,
    _type: 'page',
    path: route,
    pageType: file.startsWith('blog/') ? 'blog' : 'page',
    title: titleM ? decode(titleM[1].trim()) : '',
    metaDescription: descM ? decode(descM[1]) : '',
    bodyClass,
    headHtml: headHtml.trim(),
    bodyStartHtml: b.slice(0, hStart),
    contentHtml: b.slice(hEnd, fStart),
    bodyEndHtml: b.slice(fEnd),
  };
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(doc, null, 1));
}
console.log(`Wrote ${files.length - problems} pages to ${OUT} (${problems} problems)`);
