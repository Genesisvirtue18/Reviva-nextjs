import { notFound } from 'next/navigation';
import { getPage, toUrlPath } from '@/lib/content';

/* The page body between the shared header and footer, served verbatim from
   the CMS. id="main" is the skip-link target that custom.js used to assign. */

export default async function SitePage({ params }: PageProps<'/[[...path]]'>) {
  const { path } = await params;
  const page = await getPage(toUrlPath(path));
  if (!page) notFound();

  return <div id="main" tabIndex={-1} dangerouslySetInnerHTML={{ __html: page.contentHtml }} />;
}
