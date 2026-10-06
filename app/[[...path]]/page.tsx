import { notFound } from 'next/navigation';
import { getDoc, getPostCards, getSettings, toUrlPath } from '@/lib/content';
import { Blocks, WhatsAppButton } from '@/components/blocks';
import { PostView } from '@/components/blog';

/* The body between the shared header and footer: a blog post, or a page's
   sections. id="main" is the skip-link target. */

export default async function SitePage({ params }: PageProps<'/[[...path]]'>) {
  const { path } = await params;
  const doc = await getDoc(toUrlPath(path));
  if (!doc) notFound();
  const settings = await getSettings();

  if (doc.kind === 'post') {
    const cards = await getPostCards();
    const i = cards.findIndex((c) => c.path === doc.path);
    return (
      <div id="main" tabIndex={-1}>
        <div className="rv-scrim"></div>
        <PostView
          post={doc}
          s={settings}
          latest={cards.filter((c) => c.path !== doc.path).slice(0, 5)}
          prev={i >= 0 ? cards[i + 1] : undefined}
          next={i > 0 ? cards[i - 1] : undefined}
        />
      </div>
    );
  }

  const posts = doc.blocks?.some((b) => b._type === 'postGrid') ? await getPostCards() : [];
  return (
    <div id="main" tabIndex={-1}>
      <div className="rv-scrim"></div>
      <Blocks blocks={doc.blocks} data={{ posts }} />
      {doc.whatsapp !== false ? <WhatsAppButton href={settings.whatsappUrl} /> : null}
      {doc.scriptsHtml ? <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: doc.scriptsHtml }} /> : null}
    </div>
  );
}
