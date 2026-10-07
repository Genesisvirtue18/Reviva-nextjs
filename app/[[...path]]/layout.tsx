import type { Metadata } from 'next';
import Script from 'next/script';
import { notFound, permanentRedirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SiteScript } from '@/components/SiteScript';
import { getDoc, getRedirect, getSettings, toUrlPath } from '@/lib/content';
import { absoluteImage } from '@/lib/image';

/* Root layout for every public page: the site-wide <head> (fonts,
   stylesheets, Google Analytics / Tag Manager from Site Settings) and the
   header and footer. Per-page tags (title, description, canonical, social
   sharing, robots) come from generateMetadata. */

// Rendered on every request from live Sanity content (no cache).
export const dynamic = 'force-dynamic';

/* The site script, versioned per deploy so browsers fetch a fixed copy
   at once (/assets/*.js is cached for a year). */
const SCRIPT_VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? 'dev';

const STYLESHEETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/remixicon@4.3.0/fonts/remixicon.css',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap',
  `/assets/css/style.css?v=${SCRIPT_VERSION}`,
  `/assets/css/responsive.css?v=${SCRIPT_VERSION}`,
  `/assets/css/articles.css?v=${SCRIPT_VERSION}`,
  `/assets/css/gallery.css?v=${SCRIPT_VERSION}`,
];

export async function generateMetadata({ params }: LayoutProps<'/[[...path]]'>): Promise<Metadata> {
  const { path } = await params;
  const urlPath = toUrlPath(path);
  const [doc, s] = await Promise.all([getDoc(urlPath), getSettings()]);
  if (!doc) return {};
  const site = s.siteUrl.replace(/\/+$/, '');
  const url = site + (urlPath === '/' ? '/' : urlPath);
  const image = absoluteImage(doc.shareImage, site) ?? absoluteImage(s.shareImage, site);
  const imageAlt = s.clinicName;
  return {
    metadataBase: new URL(site),
    title: doc.headTitle,
    description: doc.metaDescription || undefined,
    alternates: { canonical: url },
    robots: { index: !doc.noindex, follow: true },
    verification: s.googleVerification ? { google: s.googleVerification } : undefined,
    icons: { icon: [{ url: '/assets/images/favicon.webp', type: 'image/webp' }] },
    openGraph: {
      type: doc.kind === 'post' ? 'article' : 'website',
      siteName: s.clinicName,
      title: doc.headTitle,
      description: doc.metaDescription || undefined,
      url,
      images: image ? [{ url: image, alt: imageAlt }] : undefined,
    },
    twitter: { card: 'summary_large_image', title: doc.headTitle, description: doc.metaDescription || undefined, images: image ? [image] : undefined },
  };
}

export default async function SiteLayout({ children, params }: LayoutProps<'/[[...path]]'>) {
  const { path } = await params;
  const urlPath = toUrlPath(path);
  const [page, s] = await Promise.all([getDoc(urlPath), getSettings()]);
  if (!page) {
    const to = await getRedirect(urlPath);
    if (to) permanentRedirect(to);
    notFound();
  }
  const site = s.siteUrl.replace(/\/+$/, '');

  // The clinic, for Google (built from Site Settings).
  const clinic = {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    name: s.clinicName,
    url: site + (urlPath === '/' ? '/' : urlPath),
    image: absoluteImage(s.shareImage, site),
    telephone: s.locations.map((l) => l.phoneDisplay),
    email: s.email,
    address: s.locations[0] ? { '@type': 'PostalAddress', streetAddress: s.locations[0].address, addressCountry: 'IN' } : undefined,
    openingHours: s.hours,
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {STYLESHEETS.map((href) => (
          <link rel="stylesheet" href={href} key={href} />
        ))}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(clinic) }} />
      </head>
      <body className={page.bodyClass || undefined} suppressHydrationWarning>
        {s.gtmId ? (
          <noscript>
            <iframe src={`https://www.googletagmanager.com/ns.html?id=${s.gtmId}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
          </noscript>
        ) : null}
        <Header s={s} path={urlPath} />
        {children}
        <Footer s={s} />
        <SiteScript src={`/assets/js/custom.js?v=${SCRIPT_VERSION}`} />
        {s.gaId ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${s.gaId}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${s.gaId}');`}
            </Script>
          </>
        ) : null}
        {s.gtmId ? (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${s.gtmId}');`}
          </Script>
        ) : null}
      </body>
    </html>
  );
}
