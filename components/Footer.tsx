import type { SiteSettings } from '@/lib/types';

const PHONE_ICON = 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2Z';

/* Rolls the copyright year over on 1 January without a redeploy (carried over
   from the static footer). */
const YEAR_SCRIPT = `(function () {
  var el = document.getElementById('rv-year');
  if (!el) return;
  var now   = new Date().getFullYear();
  var baked = parseInt(el.textContent, 10);
  if (now > baked) { el.textContent = now; }
})();`;

export default function Footer({ s }: { s: SiteSettings }) {
  return (
    <footer className="rv-footer">
      <div className="rv-footer__inner">
        <div className="rv-footer__grid">
          <div className="rv-footer__brand">
            <a className="rv-footer__logo" href="/" aria-label={`${s.logoAlt} — home`}>
              <img src={s.logo} alt={s.logoAlt} width={240} height={58} />
            </a>

            <p className="rv-footer__blurb">{s.footerBlurb}</p>

            <div className="rv-footer__social">
              <a href={s.social.facebook} aria-label="Reviva on Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1Z" /></svg>
              </a>
              <a href={s.social.instagram} aria-label="Reviva on Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" stroke="none" /></svg>
              </a>
              <a href={s.social.youtube} aria-label="Reviva on YouTube">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z" /></svg>
              </a>
              <a href={s.social.x} aria-label="Reviva on X">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 3h3l-6.6 7.5L21.7 21h-6l-4.7-6.1L5.6 21h-3l7-8L2.6 3h6.1l4.2 5.6L17.5 3Zm-1.1 16.1h1.7L7.7 4.8H5.9l10.5 14.3Z" /></svg>
              </a>
            </div>
          </div>

          <nav className="rv-footer__col" aria-label="Treatments">
            <h3>Treatments</h3>
            <ul>
              {s.footerTreatments.map((l) => (
                <li key={l.href + l.label}><a className="rv-footer__link" href={l.href}>{l.label}</a></li>
              ))}
            </ul>
          </nav>

          <nav className="rv-footer__col" aria-label="Clinic">
            <h3>Clinic</h3>
            <ul>
              {s.footerClinic.map((l) => (
                <li key={l.href + l.label}><a className="rv-footer__link" href={l.href}>{l.label}</a></li>
              ))}
            </ul>
          </nav>

          <div className="rv-footer__col">
            <h3>Visit Us</h3>

            {s.locations.map((loc) => (
              <div className="rv-location" key={loc.name}>
                <h4>{loc.name}</h4>
                <p>{loc.address}</p>
                <a className="rv-contact-link" href={`tel:${loc.phoneTel}`}>
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={PHONE_ICON} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {loc.phoneDisplay}
                </a>
              </div>
            ))}

            <div className="rv-location">
              <a className="rv-contact-link" href={`mailto:${s.email}`}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.9" /><path d="m3 7 9 6 9-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {s.email}
              </a>
            </div>

            <div className="rv-hours">
              <h4>Clinic Hours</h4>
              <p>{s.hours}</p>
            </div>
          </div>
        </div>

        <div className="rv-footer__bottom">
          <p className="rv-footer__copy">
            © <span id="rv-year">{new Date().getFullYear()}</span> Reviva Skin &amp; Surgery Clinic. All rights reserved.
          </p>
          <ul className="rv-footer__legal">
            {s.legal.map((l) => (
              <li key={l.href + l.label}><a href={l.href}>{l.label}</a></li>
            ))}
          </ul>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: YEAR_SCRIPT }} />
    </footer>
  );
}
