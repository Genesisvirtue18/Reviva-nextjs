import type { Metadata } from 'next';
import { getSettings } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Page Not Found | Reviva Skin & Surgery Clinic',
  robots: { index: false },
};

export default async function GlobalNotFound() {
  const { notFound: t } = await getSettings();
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/assets/css/style.css" />
        <link rel="stylesheet" href="/assets/css/responsive.css" />
      </head>
      <body>
        <section className="rv-endcta" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
          <div className="rv-endcta__panel">
            <p className="rv-endcta__eyebrow">{t.eyebrow}</p>
            <h1 className="rv-endcta__title">{t.title}</h1>
            <div className="rv-endcta__actions">
              <a className="rv-endcta__btn rv-endcta__btn--solid" href={t.buttonHref}>{t.buttonLabel}</a>
            </div>
          </div>
        </section>
      </body>
    </html>
  );
}
