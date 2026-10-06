import { renderFields } from '@/lib/render-fields';
import type { PageSection } from '@/lib/types';
import { Banner, BeforeAfter, CtaBanner, Faq, Procedure, ServiceHero, ServiceOverview } from './treatment';
import { BLOCKS_MORE } from './more';
import { PostGrid, type PostCard } from '@/components/blog';

/* Page builder: one component per section type. Pages are an ordered list
   of these blocks, edited as sections in the Studio. */

export type CustomSectionBlock = { _type: 'customSection'; _key: string; templateHtml?: string; groups?: PageSection[] };

/* A section with a one-off design: its layout is fixed, its text and
   pictures are fields. display:contents keeps the wrapper out of the layout. */
function CustomSection({ b }: { b: CustomSectionBlock }) {
  return <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: renderFields(b.templateHtml ?? '', b.groups) }} />;
}

export type BlockData = { posts: PostCard[] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPONENTS: Record<string, (props: { b: any; data: BlockData }) => React.ReactNode> = {
  serviceHero: ServiceHero,
  serviceOverview: ServiceOverview,
  procedure: Procedure,
  beforeAfter: BeforeAfter,
  faq: Faq,
  ctaBanner: CtaBanner,
  banner: Banner,
  customSection: CustomSection,
  spacer: () => <br />,
  postGrid: ({ data }) => <PostGrid posts={data.posts} />,
  ...BLOCKS_MORE,
};

export type AnyBlock = { _type: string; _key: string; [k: string]: unknown };

export function Blocks({ blocks, data = { posts: [] } }: { blocks?: AnyBlock[]; data?: BlockData }) {
  return (
    <>
      {(blocks ?? []).map((b) => {
        const C = COMPONENTS[b._type];
        return C ? <C key={b._key} b={b} data={data} /> : null;
      })}
    </>
  );
}

/** The floating WhatsApp button shown on every page except blog posts. */
export function WhatsAppButton({ href }: { href: string }) {
  return (
    <a href={href} className="whatsapp-btn" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">
      <img src="/assets/images/whatsapp logo.webp" alt="" width="40" height="40" />
    </a>
  );
}
