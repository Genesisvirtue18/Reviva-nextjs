import { notFound, permanentRedirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RawTags from '@/components/RawTags';
import { getDoc, getRedirect, getSettings, toUrlPath } from '@/lib/content';

/* Root layout for every public page. It owns <html>/<head>/<body> so each
   page can set its own <body class> and head tags, the way the static HTML
   files did. */

// Rendered on every request from live Sanity content (no cache).
export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children, params }: LayoutProps<'/[[...path]]'>) {
  const { path } = await params;
  const urlPath = toUrlPath(path);
  const [page, settings] = await Promise.all([getDoc(urlPath), getSettings()]);
  if (!page) {
    const to = await getRedirect(urlPath);
    if (to) permanentRedirect(to);
    notFound();
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{page.headTitle}</title>
        {page.metaDescription ? <meta name="description" content={page.metaDescription} /> : null}
        <RawTags html={page.headHtml} />
      </head>
      <body className={page.bodyClass || undefined} suppressHydrationWarning>
        <RawTags html={page.bodyStartHtml} />
        <Header s={settings} path={urlPath} />
        {children}
        <Footer s={settings} />
        <RawTags html={page.bodyEndHtml} />
      </body>
    </html>
  );
}
