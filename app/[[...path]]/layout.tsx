import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RawTags from '@/components/RawTags';
import { getAllPaths, getDoc, getSettings, toUrlPath } from '@/lib/content';

/* Root layout for every public page. It owns <html>/<head>/<body> so each
   page can set its own <body class> and head tags, the way the static HTML
   files did. */

export const revalidate = 3600;

export async function generateStaticParams() {
  const paths = await getAllPaths();
  return paths.map((p) => ({ path: p === '/' ? [] : p.slice(1).split('/') }));
}

export default async function SiteLayout({ children, params }: LayoutProps<'/[[...path]]'>) {
  const { path } = await params;
  const urlPath = toUrlPath(path);
  const [page, settings] = await Promise.all([getDoc(urlPath), getSettings()]);
  if (!page) notFound();

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
