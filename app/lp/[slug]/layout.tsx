import type { Metadata } from 'next';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { getLanding } from '@/lib/content';

/* Ad landing pages have their own look: each design loads its own fonts and
   stylesheets (no site header / footer), and the page's own Google Tag
   Manager container. */

export const dynamic = 'force-dynamic';

const HEAD: Record<string, { href: string; integrity?: string }[]> = {
  care: [
    { href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@600;700&display=swap' },
    { href: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css', integrity: 'sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH' },
    { href: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css' },
    { href: 'https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/assets/owl.carousel.min.css' },
    { href: 'https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/assets/owl.theme.default.min.css' },
    { href: '/lp/skin-care-clinic-in-noida/lp.css' },
  ],
  clinic: [
    { href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap' },
    { href: 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css', integrity: 'sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC' },
    { href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css' },
    { href: '/lp/skin-clinic-in-noida/assets/css/style.css' },
  ],
};
const ICON: Record<string, string> = { clinic: '/lp/skin-clinic-in-noida/assets/images/favicon.webp' };

export async function generateMetadata({ params }: LayoutProps<'/lp/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const lp = await getLanding(slug);
  if (!lp) return {};
  const title = lp.seoTitle || lp.title;
  return {
    title,
    description: lp.metaDescription,
    robots: { index: true, follow: true },
    openGraph: { type: 'website', title, description: lp.metaDescription },
    icons: ICON[lp.design ?? ''] ? { icon: [{ url: ICON[lp.design ?? ''], type: 'image/webp' }] } : undefined,
  };
}

export default async function LandingLayout({ children, params }: LayoutProps<'/lp/[slug]'>) {
  const { slug } = await params;
  const lp = await getLanding(slug);
  if (!lp) notFound();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {(HEAD[lp.design ?? 'care'] ?? []).map((l) => (
          <link rel="stylesheet" href={l.href} key={l.href} {...(l.integrity ? { integrity: l.integrity, crossOrigin: 'anonymous' as const } : {})} />
        ))}
      </head>
      <body>
        {lp.gtmId ? (
          <noscript>
            <iframe src={`https://www.googletagmanager.com/ns.html?id=${lp.gtmId}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
          </noscript>
        ) : null}
        {children}
        {lp.gtmId ? (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${lp.gtmId}');`}
          </Script>
        ) : null}
      </body>
    </html>
  );
}
