import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found | Reviva Skin & Surgery Clinic',
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/assets/css/style.css" />
        <link rel="stylesheet" href="/assets/css/responsive.css" />
      </head>
      <body>
        <section className="rv-endcta" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
          <div className="rv-endcta__panel">
            <p className="rv-endcta__eyebrow">404</p>
            <h1 className="rv-endcta__title">This page could not be found</h1>
            <div className="rv-endcta__actions">
              <a className="rv-endcta__btn rv-endcta__btn--solid" href="/">Back to home</a>
            </div>
          </div>
        </section>
      </body>
    </html>
  );
}
