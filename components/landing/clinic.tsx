import { createElement, type CSSProperties, type ReactNode } from 'react';
import { Inline, Lines, Rich, type Block, type MarkRenderers, type RichValue } from '@/lib/rich';
import { pictureSrc, type Picture } from '@/lib/image';
import { ClinicFaqList, ClinicBookingForm } from './clinic-client';

/* Landing page design "clinic" (/lp/skin-clinic-in-noida). Markup, classes
   and inline styles are the original page's, styled by
   public/lp/skin-clinic-in-noida/assets/css/style.css. */

const Line = ({ value, marks }: { value?: RichValue; marks?: MarkRenderers }) => {
  const block = value?.find((b) => b._type === 'block') as Block | undefined;
  return block ? <Inline block={block} marks={marks} /> : null;
};
/** The Gold style drawn as a coloured span / em (as on the original page). */
const colour = (color: string, tag = 'span', extra: CSSProperties = {}): MarkRenderers => ({
  highlight: (children, key) => createElement(tag, { key, style: { ...extra, color } }, children),
});
const Img = ({ p, ...rest }: { p?: Picture } & Record<string, unknown>) => <img src={pictureSrc(p)} alt={p?.alt} {...rest} />;
const blank = (href?: string) => (href && /^https?:/.test(href) ? { target: '_blank', rel: 'noopener' } : {});
const PAD = { padding: '70px 5%' };

type Head = { tag?: string; title?: RichValue; sub?: RichValue };
function SectionHead({ h, marks, tagClass = 'section-tag' }: { h: Head; marks?: MarkRenderers; tagClass?: string }) {
  return (
    <div className="text-center mb-40">
      <span className={tagClass}>{h.tag}</span>
      <h2 className="section-title">
        <Line value={h.title} marks={marks} />
      </h2>
      {h.sub ? (
        <p className="section-sub mx-auto text-center">
          <Line value={h.sub} />
        </p>
      ) : null}
    </div>
  );
}

export type ClinicNav = { _type: 'clinicNav'; _key: string; brand?: string; brandSub?: string; callLabel?: string; callHref?: string; waLabel?: string; waHref?: string };
function Nav({ b }: { b: ClinicNav }) {
  return (
    <nav className="nav">
      <div className="nav-logo">
        {b.brand} <span>{b.brandSub}</span>
      </div>
      <div className="nav-ctas">
        <a href={b.callHref} className="btn btn-call">
          {b.callLabel}
        </a>
        <a href={b.waHref} className="btn btn-wa" {...blank(b.waHref)}>
          {b.waLabel}
        </a>
      </div>
    </nav>
  );
}

export type ClinicHero = {
  _type: 'clinicHero';
  _key: string;
  badge?: string;
  title?: RichValue;
  sub?: RichValue;
  bullets?: { _key: string; text?: RichValue }[];
  stats?: { _key: string; value?: string; label?: string }[];
  image?: Picture;
  intro?: string;
};
const DIVIDER: CSSProperties = { width: '1px', background: 'var(--border)', height: '40px', alignSelf: 'center' };
function Hero({ b }: { b: ClinicHero }) {
  return (
    <section className="hero-with-form" style={{ paddingTop: '50px' }}>
      <div>
        <div className="hero-badge">{b.badge}</div>
        <h1 style={{ fontSize: 'clamp(28px,4vw,46px)', lineHeight: 1.2, marginBottom: '16px' }}>
          <Line value={b.title} marks={colour('#8B5C8A', 'em', { fontStyle: 'normal' })} />
        </h1>
        <p className="hero-sub">
          <Line value={b.sub} />
        </p>
        <ul className="hero-bullets">
          {(b.bullets ?? []).map((x, i) => (
            <li key={x._key}>
              <span className="bullet-num">{i + 1}</span>
              <span>
                <Line value={x.text} />
              </span>
            </li>
          ))}
        </ul>
        <div className="hero-stats">
          {(b.stats ?? []).flatMap((s, i) => [
            ...(i ? [<div style={DIVIDER} key={`d${s._key}`}></div>] : []),
            <div className="stat-chip" key={s._key}>
              <div className="num">{s.value}</div>
              <div className="lbl">{s.label}</div>
            </div>,
          ])}
        </div>
      </div>
      <div className="rgithsidec">
        <Img p={b.image} className="img-fluid" />
        <div className="rgithsidec1">
          <p>{b.intro}</p>
        </div>
      </div>
    </section>
  );
}

export type ClinicReviewsBar = { _type: 'clinicReviewsBar'; _key: string; score?: string; stars?: string; label?: string; stats?: { _key: string; value?: string; label?: string }[] };
function ReviewsBar({ b }: { b: ClinicReviewsBar }) {
  return (
    <div className="reviews-bar" style={{ marginTop: '-20px', position: 'relative', zIndex: 2 }}>
      <div className="review-score">
        <div className="score-big">{b.score}</div>
        <div className="score-right">
          <div className="stars-row">{b.stars}</div>
          <div className="score-label">{b.label}</div>
        </div>
      </div>
      {(b.stats ?? []).flatMap((s) => [
        <div className="divider-v" key={`d${s._key}`}></div>,
        <div style={{ textAlign: 'center' }} key={s._key}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', fontFamily: "'Playfair Display',serif" }}>{s.value}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.label}</div>
        </div>,
      ])}
    </div>
  );
}

export type ClinicServices = { _type: 'clinicServices'; _key: string; tag?: string; title?: RichValue; sub?: RichValue; services?: { _key: string; icon?: string; title?: string; text?: string }[] };
function Services({ b }: { b: ClinicServices }) {
  return (
    <section style={PAD}>
      <SectionHead h={b} />
      <div className="services-grid">
        {(b.services ?? []).map((s) => (
          <div className="service-card" key={s._key}>
            <div className="service-icon">{s.icon}</div>
            <h4>{s.title}</h4>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

type CtaButton = { _key: string; label?: string; href?: string; style?: 'white' | 'ghost' };
export type ClinicCta = { _type: 'clinicCta'; _key: string; title?: string; text?: RichValue; buttons?: CtaButton[] };
const GHOST: CSSProperties = { background: 'rgba(255,255,255,0.15)', color: 'white', border: '2px solid rgba(255,255,255,0.4)' };
function Cta({ b }: { b: ClinicCta }) {
  return (
    <div style={{ padding: '0 5% 60px' }}>
      <div className="cta-banner">
        <div>
          <h3>{b.title}</h3>
          <p>
            <Line value={b.text} />
          </p>
        </div>
        <div className="cta-banner-btns">
          {(b.buttons ?? []).map((x) =>
            x.style === 'ghost' ? (
              <a href={x.href} className="btn btn-lg" style={GHOST} key={x._key} {...blank(x.href)}>
                {x.label}
              </a>
            ) : (
              <a href={x.href} className="btn btn-white btn-lg" key={x._key} {...blank(x.href)}>
                {x.label}
              </a>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

type Button = { _key: string; label?: string; href?: string; style?: 'primary' | 'wa' };
const BTN: Record<string, string> = { primary: 'btn btn-primary btn-lg', wa: 'btn btn-wa btn-lg', call: 'btn btn-call btn-lg' };
export type ClinicDoctor = {
  _type: 'clinicDoctor';
  _key: string;
  tag?: string;
  title?: RichValue;
  image?: Picture;
  badge?: string;
  name?: string;
  credentials?: string;
  achievement?: RichValue;
  qualifications?: { _key: string; icon?: string; text?: RichValue }[];
  buttons?: Button[];
};
function Doctor({ b }: { b: ClinicDoctor }) {
  return (
    <section className="section-alt" style={PAD}>
      <SectionHead h={b} />
      <div className="doctor-card">
        <div>
          <Img p={b.image} className="doctor-img" loading="lazy" />
        </div>
        <div>
          <div className="doctor-badge">{b.badge}</div>
          <h2 className="doctor-name">{b.name}</h2>
          <div className="doctor-title">{b.credentials}</div>
          <div className="achievement-box">
            <Line value={b.achievement} />
          </div>
          <ul className="qual-list">
            {(b.qualifications ?? []).map((q) => (
              <li key={q._key}>
                <span className="q-icon">{q.icon}</span>
                <span>
                  <Line value={q.text} />
                </span>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {(b.buttons ?? []).map((x) => (
              <a href={x.href} className={BTN[x.style ?? 'primary']} key={x._key} {...blank(x.href)}>
                {x.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export type ClinicUsp = { _type: 'clinicUsp'; _key: string; tag?: string; title?: RichValue; sub?: RichValue; cards?: { _key: string; value?: string; label?: string; text?: RichValue }[] };
function Usp({ b }: { b: ClinicUsp }) {
  return (
    <section style={PAD}>
      <SectionHead h={b} marks={colour('var(--primary)')} />
      <div className="usp-grid">
        {(b.cards ?? []).map((c) => (
          <div className="usp-card" key={c._key}>
            <div className="usp-num">{c.value}</div>
            <div className="usp-label">{c.label}</div>
            <div className="usp-desc">
              <Line value={c.text} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

type VsItem = { _key: string; title?: string; text?: RichValue };
export type ClinicConcerns = { _type: 'clinicConcerns'; _key: string; tag?: string; title?: RichValue; challengesTitle?: string; challenges?: VsItem[]; solutionsTitle?: string; solutions?: VsItem[] };
function Concerns({ b }: { b: ClinicConcerns }) {
  const col = (cls: string, title?: string, items?: VsItem[]) => (
    <div className={cls}>
      <h4>{title}</h4>
      {(items ?? []).map((x) => (
        <div className="vs-item" key={x._key}>
          <strong>{x.title}</strong> <Line value={x.text} />
        </div>
      ))}
    </div>
  );
  return (
    <section className="section-gold" style={PAD}>
      <SectionHead h={b} marks={colour('var(--gold)')} tagClass="section-tag gold" />
      <div className="challenge-solutions">
        {col('challenge-col', b.challengesTitle, b.challenges)}
        {col('solution-col', b.solutionsTitle, b.solutions)}
      </div>
    </section>
  );
}

type Cell = { text?: string; cross?: boolean };
export type ClinicCompare = {
  _type: 'clinicCompare';
  _key: string;
  tag?: string;
  title?: RichValue;
  sub?: RichValue;
  headers?: string[];
  rows?: { _key: string; feature?: string; reviva?: string; revivaTick?: boolean; generic?: Cell; other?: Cell }[];
};
function Compare({ b }: { b: ClinicCompare }) {
  const [h0, h1, h2, h3] = b.headers ?? [];
  const cell = (c?: Cell) => <td className={c?.cross ? 'cross' : undefined}>{c?.text}</td>;
  return (
    <section style={PAD}>
      <SectionHead h={b} />
      <div style={{ overflowX: 'auto' }}>
        <table className="compare-table">
          <thead>
            <tr>
              <th>{h0}</th>
              <th style={{ background: '#7a4f79' }}>{h1}</th>
              <th style={{ background: '#888' }}>{h2}</th>
              <th style={{ background: '#888' }}>{h3}</th>
            </tr>
          </thead>
          <tbody>
            {(b.rows ?? []).map((r) => (
              <tr key={r._key}>
                <td>{r.feature}</td>
                <td className="reviva-col">
                  {r.revivaTick ? (
                    <>
                      <span className="check">✓</span>{' '}
                    </>
                  ) : null}
                  {r.reviva}
                </td>
                {cell(r.generic)}
                {cell(r.other)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export type ClinicResults = { _type: 'clinicResults'; _key: string; tag?: string; title?: RichValue; sub?: RichValue; images?: (Picture & { _key: string })[]; buttonLabel?: string; buttonHref?: string };
function Results({ b }: { b: ClinicResults }) {
  return (
    <section className="section-alt" style={PAD}>
      <SectionHead h={b} />
      <div className="ba-grid">
        {(b.images ?? []).map((p) => (
          <div className="ba-card" key={p._key}>
            <Img p={p} loading="lazy" />
          </div>
        ))}
      </div>
      {b.buttonLabel ? (
        <div style={{ textAlign: 'center', marginTop: '36px' }}>
          <a href={b.buttonHref} className="btn btn-primary btn-lg" {...blank(b.buttonHref)}>
            {b.buttonLabel}
          </a>
        </div>
      ) : null}
    </section>
  );
}

export type ClinicTestimonials = {
  _type: 'clinicTestimonials';
  _key: string;
  tag?: string;
  title?: RichValue;
  sub?: RichValue;
  items?: { _key: string; stars?: string; text?: string; keywords?: RichValue; color?: string; initials?: string; name?: string; detail?: string }[];
};
function Testimonials({ b }: { b: ClinicTestimonials }) {
  return (
    <section style={PAD}>
      <SectionHead h={b} />
      <div className="testimonials-grid">
        {(b.items ?? []).map((x) => (
          <div className="testimonial-card" key={x._key}>
            <div className="testi-stars">{x.stars}</div>
            <p className="testi-text">{x.text}</p>
            <div className="testi-keywords">
              <Line value={x.keywords} />
            </div>
            <div className="testi-author">
              <div className="testi-avatar" style={{ background: x.color }}>
                {x.initials}
              </div>
              <div>
                <div className="testi-name">
                  {x.name} <span className="verified-badge">✓ Verified</span>
                </div>
                <div className="testi-detail">{x.detail}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export type ClinicGoogleReviews = {
  _type: 'clinicGoogleReviews';
  _key: string;
  title?: string;
  stars?: string;
  score?: string;
  summary?: string;
  items?: { _key: string; color?: string; initial?: string; name?: string; date?: string; text?: string }[];
};
function GoogleReviews({ b }: { b: ClinicGoogleReviews }) {
  return (
    <section className="section-alt" style={PAD}>
      <div className="text-center mb-40">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '10px' }}>
          <div className="google-g" style={{ width: '44px', height: '44px', fontSize: '22px' }}>
            G
          </div>
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            {b.title}
          </h2>
        </div>
        <div className="stars-row" style={{ fontSize: '28px', marginBottom: '6px' }}>
          {b.stars}
        </div>
        <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>
          {b.score} <span style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 400 }}>{b.summary}</span>
        </p>
      </div>
      <div className="g-reviews-grid">
        {(b.items ?? []).map((r) => (
          <div className="g-review-card" key={r._key}>
            <div className="g-review-header">
              <div className="g-avatar" style={{ background: r.color }}>
                {r.initial}
              </div>
              <div>
                <div className="g-name">{r.name}</div>
                <div className="g-date">{r.date}</div>
              </div>
            </div>
            <div className="g-stars">★★★★★</div>
            <div className="g-text">{r.text}</div>
            <div className="g-logo">Google Review ✓</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export type ClinicFaq = { _type: 'clinicFaq'; _key: string; tag?: string; title?: RichValue; sub?: RichValue; items?: { _key: string; question?: string; answer?: RichValue }[] };
function Faq({ b }: { b: ClinicFaq }) {
  return (
    <section style={PAD}>
      <SectionHead h={b} />
      <ClinicFaqList
        items={(b.items ?? []).map((x) => ({
          key: x._key,
          question: x.question ?? '',
          answer: <Rich value={x.answer} />,
        }))}
      />
    </section>
  );
}

export type ClinicFinal = {
  _type: 'clinicFinal';
  _key: string;
  icon?: string;
  title?: string;
  text?: RichValue;
  namePlaceholder?: string;
  phonePlaceholder?: string;
  concernPlaceholder?: string;
  concerns?: string[];
  buttonLabel?: string;
  callLabel?: string;
  callHref?: string;
  waLabel?: string;
  waHref?: string;
  note?: string;
};
function Final({ b }: { b: ClinicFinal }) {
  return (
    <section style={{ ...PAD, background: 'linear-gradient(135deg,#f9f0f9 0%,#fff5ee 100%)' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>{b.icon}</div>
        <h2 className="section-title" style={{ fontSize: 'clamp(26px,3.5vw,42px)' }}>
          {b.title}
        </h2>
        <p style={{ fontSize: '17px', color: 'var(--text-mid)', marginBottom: '32px', lineHeight: 1.7 }}>
          <Line value={b.text} marks={{ highlight: (c, key) => <span className="number-highlight" key={key}>{c}</span> }} />
        </p>
        <ClinicBookingForm
          namePlaceholder={b.namePlaceholder ?? ''}
          phonePlaceholder={b.phonePlaceholder ?? ''}
          concernPlaceholder={b.concernPlaceholder ?? ''}
          concerns={b.concerns ?? []}
          buttonLabel={b.buttonLabel ?? ''}
        />
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={b.callHref} className="btn btn-call btn-lg">
            {b.callLabel}
          </a>
          <a href={b.waHref} className="btn btn-wa btn-lg" {...blank(b.waHref)}>
            {b.waLabel}
          </a>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '18px' }}>{b.note}</p>
      </div>
    </section>
  );
}

export type ClinicFooter = {
  _type: 'clinicFooter';
  _key: string;
  brand?: string;
  brandSub?: string;
  description?: string;
  callLabel?: string;
  callHref?: string;
  waLabel?: string;
  waHref?: string;
  treatmentsTitle?: string;
  treatments?: string[];
  contactTitle?: string;
  address?: string;
  phoneDisplay?: string;
  phoneHref?: string;
  waText?: string;
  hours?: string;
  copyright?: string;
  tagline?: string;
};
function Footer({ b }: { b: ClinicFooter }) {
  const small = { fontSize: '13px' };
  return (
    <footer>
      <div className="footer-grid">
        <div>
          <div className="footer-logo">
            {b.brand} <span>{b.brandSub}</span>
          </div>
          <div className="footer-desc">{b.description}</div>
          <div className="footer-btns">
            <a href={b.callHref} className="btn btn-call" style={small}>
              {b.callLabel}
            </a>
            <a href={b.waHref} className="btn btn-wa" style={small} {...blank(b.waHref)}>
              {b.waLabel}
            </a>
          </div>
        </div>
        <div>
          <h5>{b.treatmentsTitle}</h5>
          <ul className="footer-links">
            {(b.treatments ?? []).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <h5>{b.contactTitle}</h5>
          <div className="footer-address">
            <Lines text={b.address} />
            <br />
            <br />
            📞{' '}
            <a href={b.phoneHref} style={{ color: 'rgba(255,255,255,0.8)' }}>
              {b.phoneDisplay}
            </a>
            <br />
            <br />
            💬{' '}
            <a href={b.waHref} style={{ color: '#25D366' }} {...blank(b.waHref)}>
              {b.waText}
            </a>
            <br />
            <br />
            <Lines text={b.hours} />
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>{b.copyright}</span>
        <span>{b.tagline}</span>
      </div>
    </footer>
  );
}

export type ClinicFixedCta = { _type: 'clinicFixedCta'; _key: string; waLabel?: string; waHref?: string; callLabel?: string; callHref?: string };
function FixedCta({ b }: { b: ClinicFixedCta }) {
  return (
    <div className="fixed-cta" role="navigation" aria-label="Quick contact">
      <div className="fixed-cta__inner">
        <a className="cta-btn cta-btn--whatsapp" href={b.waHref} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
          <i className="fa-brands fa-whatsapp" aria-hidden="true"></i> {b.waLabel}
        </a>
        <a className="cta-btn cta-btn--call" href={b.callHref} aria-label="Call Reviva Clinic">
          <i className="fa-solid fa-phone" aria-hidden="true"></i> {b.callLabel}
        </a>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CLINIC_BLOCKS: Record<string, (p: { b: any }) => ReactNode> = {
  clinicNav: Nav,
  clinicHero: Hero,
  clinicReviewsBar: ReviewsBar,
  clinicServices: Services,
  clinicCta: Cta,
  clinicDoctor: Doctor,
  clinicUsp: Usp,
  clinicConcerns: Concerns,
  clinicCompare: Compare,
  clinicResults: Results,
  clinicTestimonials: Testimonials,
  clinicGoogleReviews: GoogleReviews,
  clinicFaq: Faq,
  clinicFinal: Final,
  clinicFooter: Footer,
  clinicFixedCta: FixedCta,
};
