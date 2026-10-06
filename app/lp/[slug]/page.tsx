import { notFound } from 'next/navigation';
import { getLanding } from '@/lib/content';
import { CARE_BLOCKS } from '@/components/landing/care';
import { CLINIC_BLOCKS } from '@/components/landing/clinic';
import { CareCarousel } from '@/components/landing/care-client';

/* /lp/<slug>: an ad landing page, built from its sections in Sanity. */

export default async function LandingPage({ params }: PageProps<'/lp/[slug]'>) {
  const { slug } = await params;
  const lp = await getLanding(slug);
  if (!lp) notFound();
  const blocks = lp.design === 'clinic' ? CLINIC_BLOCKS : CARE_BLOCKS;
  return (
    <>
      {(lp.sections ?? []).map((s) => {
        const C = blocks[s._type];
        return C ? <C key={s._key} b={s} /> : null;
      })}
      {lp.design !== 'clinic' ? <CareCarousel /> : null}
    </>
  );
}
