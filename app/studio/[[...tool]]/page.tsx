import { NextStudio } from 'next-sanity/studio';
import config from '@/sanity.config';
import { sanityEnabled } from '@/lib/sanity';

export const dynamic = 'force-static';
export { metadata, viewport } from 'next-sanity/studio';

export default function StudioPage() {
  if (!sanityEnabled) {
    return (
      <p style={{ fontFamily: 'system-ui, sans-serif', padding: 32 }}>
        Sanity is not connected yet. Set <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> (see README → “Connect Sanity”).
      </p>
    );
  }
  return <NextStudio config={config} />;
}
