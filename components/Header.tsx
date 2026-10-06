import type { SiteSettings } from '@/lib/types';

/* Markup mirrors the old static header 1:1 - the CSS and custom.js both key
   off these class names, ids and aria attributes. Plain <a> tags (not
   next/link) on purpose: every page is server-rendered HTML whose inline
   scripts must run on a full page load, exactly like the old site. */

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/* Current-page marking used to happen in custom.js, but mutating the header
   before hydration made React report a mismatch - so it is rendered here.
   Links and the current path are compared as clean paths ("/about",
   "https://site/about#x" and "about" all match /about). */
const norm = (href: string) => {
  const p = href.replace(/^https?:\/\/[^/]+/i, '').split('#')[0].split('?')[0];
  return ('/' + p.replace(/^\/+/, '')).replace(/\.html$/i, '').replace(/\/(index)?$/i, '') || '/';
};

export default function Header({ s, path }: { s: SiteSettings; path: string }) {
  const here = norm(path);
  const current = (href?: string) =>
    href && href[0] !== '#' && !/^(tel:|mailto:|https?:\/\/(?!(www\.)?revivaskinandsurgery\.com))/i.test(href) && norm(href) === here
      ? ('page' as const)
      : undefined;

  return (
    <header className="rv-header">
      <a className="rv-skip" href="#main">Skip to content</a>

      <div className="rv-header__bar">
        <a className="rv-brand" href="/" aria-current={current('/')} aria-label={`${s.logoAlt} — home`}>
          <img src={s.logo} alt={s.logoAlt} width={180} height={44} />
        </a>

        <nav className="rv-nav" id="rv-nav" aria-label="Primary">
          <ul className="rv-nav__list">
            {s.nav.map((item) =>
              item.columns?.length ? (
                <li className="rv-nav__item" key={item.label}>
                  <button className="rv-nav__link" type="button" aria-expanded="false" aria-controls={`rv-panel-${slug(item.label)}`}>
                    {item.label}{' '}
                    <svg className="rv-caret" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>

                  <div className="rv-panel" id={`rv-panel-${slug(item.label)}`}>
                    <div className="rv-panel__grid">
                      {item.columns.map((col) => (
                        <div className={col.feature ? 'rv-panel__col rv-panel__col--feature' : 'rv-panel__col'} key={col.title}>
                          <h3>{col.title}</h3>
                          {col.description ? <p>{col.description}</p> : null}
                          <ul>
                            {col.links.map((l) => (
                              <li key={l.href + l.label}><a href={l.href} aria-current={current(l.href)}>{l.label}</a></li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </li>
              ) : (
                <li className="rv-nav__item" key={item.label}><a className="rv-nav__link" href={item.href} aria-current={current(item.href)}>{item.label}</a></li>
              ),
            )}
          </ul>
        </nav>

        <div className="rv-actions">
          <a className="rv-call" href={`tel:${s.callTel}`} aria-label={`Call Reviva Skin and Surgery Clinic on ${s.callDisplay}`}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="rv-call__label">{s.callDisplay}</span>
          </a>

          <a className="rv-cta" href={s.bookUrl}><span className="rv-cta__full">{s.bookLabel}</span><span className="rv-cta__short">{s.bookLabelShort}</span></a>

          <button className="rv-toggle" type="button" aria-expanded="false" aria-controls="rv-nav" aria-label="Open menu">
            <span className="rv-toggle__box" aria-hidden="true"><span></span><span></span><span></span></span>
          </button>
        </div>
      </div>
    </header>
  );
}
