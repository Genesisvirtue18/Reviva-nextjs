import { Lines, Rich, type RichValue } from '@/lib/rich';
import { imageUrl, type SanityImage } from '@/lib/image';

/* Sections of the treatment pages (and others that reuse them). Markup and
   class names are the original site's, so style.css applies unchanged. */

const Arrow = () => (
  <svg viewBox="0 0 20 12" width="20" height="12" aria-hidden="true" focusable="false">
    <path d="M0 6h17M12.5 1 17.5 6l-5 5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export type ServiceHeroBlock = { _type: 'serviceHero'; _key: string; heroClass?: string; eyebrow?: string; title?: string; text?: string; image?: SanityImage };
export function ServiceHero({ b }: { b: ServiceHeroBlock }) {
  const bg = imageUrl(b.image);
  return (
    <section className={['rv-shero', b.heroClass].filter(Boolean).join(' ')} style={bg ? { backgroundImage: `url("${bg}")` } : undefined}>
      <div className="rv-shero__scrim"></div>
      <div className="rv-shero__inner">
        {b.eyebrow ? <p className="rv-shero__eyebrow">{b.eyebrow}</p> : null}
        {b.title ? (
          <h1 className="rv-shero__title">
            <Lines text={b.title} />
          </h1>
        ) : null}
        {b.text ? (
          <p className="rv-shero__text">
            <Lines text={b.text} />
          </p>
        ) : null}
      </div>
    </section>
  );
}

export type ServiceOverviewBlock = {
  _type: 'serviceOverview';
  _key: string;
  heading?: string;
  body?: RichValue;
  columns?: { _key: string; title?: string; items?: string[] }[];
};
export function ServiceOverview({ b }: { b: ServiceOverviewBlock }) {
  return (
    <section className="rv-svc">
      <div className="rv-svc__wrap">
        <div className="rv-svc__intro">
          <h2 className="rv-svc__eyebrow">{b.heading}</h2>
          <div className="rv-svc__body">
            <Rich value={b.body} />
          </div>
        </div>
        {b.columns?.length ? (
          <div className="rv-svc__panel">
            <div className="rv-svc__cols">
              {b.columns.map((col) => (
                <div className="rv-svc__col" key={col._key}>
                  <h3 className="rv-svc__col-title">{col.title}</h3>
                  <ul className="rv-svc__list">
                    {(col.items ?? []).map((it, i) => (
                      <li key={i}>
                        <Lines text={it} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export type ProcedureBlock = { _type: 'procedure'; _key: string; variant?: 'steps' | 'list'; heading?: string; steps?: { _key: string; text?: string }[] };
export function Procedure({ b }: { b: ProcedureBlock }) {
  if (b.variant === 'list') {
    return (
      <section className="procedure-section">
        <div className="container">
          <h2 className="section-title">{b.heading}</h2>
          <div className="procedure-list">
            {(b.steps ?? []).map((s, i) => (
              <div className="procedure-item" key={s._key}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                <p>
                  <Lines text={s.text} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="procedure-section">
      <div className="procedure-container">
        <h2>{b.heading}</h2>
        <div className="procedure-steps">
          {(b.steps ?? []).map((s, i) => (
            <div className="step" key={s._key}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <p>
                <Lines text={s.text} />
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Before & after strip. Its markup varied page to page on the old site; the
   hidden `design` records each page's variant so every page looks exactly as
   before, while editors only see the texts and the button. */
export type BeforeAfterDesign = {
  section?: 'results-section' | 'results-strip';
  overlay?: boolean;
  container?: boolean;
  eyebrowTag?: 'span' | 'p';
  eyebrowClass?: string;
  textTag?: 'p' | 'span';
  buttonClass?: string;
  icon?: string;
};
export type BeforeAfterBlock = {
  _type: 'beforeAfter';
  _key: string;
  design?: BeforeAfterDesign;
  eyebrow?: string;
  heading?: string;
  text?: string;
  buttonLabel?: string;
  buttonHref?: string;
};
export function BeforeAfter({ b }: { b: BeforeAfterBlock }) {
  const d = b.design ?? {};
  const Eyebrow = (d.eyebrowTag ?? 'span') as 'span';
  const Text = (d.textTag ?? 'p') as 'p';
  const Section = d.section ?? 'results-section';
  return (
    <section className={Section}>
      {d.overlay ? <div className="results-overlay"></div> : null}
      <div className={d.container ? 'container results-content' : 'results-content'}>
        <Eyebrow className={d.eyebrowClass}>{b.eyebrow}</Eyebrow>
        <h2>
          <Lines text={b.heading} />
        </h2>
        <Text>
          <Lines text={b.text} />
        </Text>
        {b.buttonLabel ? (
          <a href={b.buttonHref} className={d.buttonClass ?? 'gallery-btn'}>
            {b.buttonLabel}
            {d.icon ? (
              <>
                {' '}
                <i className={d.icon}></i>
              </>
            ) : null}
          </a>
        ) : null}
      </div>
    </section>
  );
}

export type FaqBlock = {
  _type: 'faq';
  _key: string;
  variant?: 'classic' | 'list' | 'wrapper' | 'boxes' | 'flat' | 'accordion';
  heading?: string;
  items?: { _key: string; question?: string; answer?: RichValue }[];
};
export function Faq({ b }: { b: FaqBlock }) {
  const items = b.items ?? [];
  const classicItem = (it: (typeof items)[number]) => (
    <div className="faq-item" key={it._key}>
      <button className="faq-question">
        {it.question} <span>+</span>
      </button>
      <div className="faq-answer">
        <Rich value={it.answer} />
      </div>
    </div>
  );
  if (b.variant === 'wrapper') {
    return (
      <section className="faq-section">
        <div className="container">
          <h2 className="faq-title">{b.heading}</h2>
          <div className="faq-wrapper">{items.map(classicItem)}</div>
        </div>
      </section>
    );
  }
  if (b.variant === 'flat') {
    return (
      <section className="faq-section">
        <div className="faq-container">
          <h2>{b.heading}</h2>
          {items.map(classicItem)}
        </div>
      </section>
    );
  }
  if (b.variant === 'boxes') {
    return (
      <section className="faq-section">
        <div className="faq-container">
          <h2>{b.heading}</h2>
          {items.map((it) => (
            <div className="faq-box" key={it._key}>
              <div className="faq-question">
                <span>{it.question}</span>
                <button>+</button>
              </div>
              <div className="faq-answer">
                <Rich value={it.answer} />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  if (b.variant === 'accordion') {
    return (
      <section className="reviva-faq-wrap">
        <div className="reviva-faq-inner">
          <h2 className="reviva-faq-title">{b.heading}</h2>
          {(b.items ?? []).map((it) => (
            <div className="reviva-faq-item" key={it._key}>
              <div className="reviva-faq-head">
                <span>{it.question}</span>
                <div className="reviva-faq-icon">+</div>
              </div>
              <div className="reviva-faq-body">
                <div className="reviva-faq-content">
                  <Rich value={it.answer} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  return (
    <section className="faq-section">
      <div className="faq-container">
        <h2>{b.heading}</h2>
        <div className={b.variant === 'list' ? 'faq-list' : 'faq-box'}>{items.map(classicItem)}</div>
      </div>
    </section>
  );
}

type Button = { label?: string; href?: string; newTab?: boolean };
export type CtaBannerBlock = { _type: 'ctaBanner'; _key: string; eyebrow?: string; heading?: string; text?: string; primary?: Button; secondary?: Button };
export function CtaBanner({ b }: { b: CtaBannerBlock }) {
  const btn = (x: Button | undefined, kind: 'solid' | 'ghost') =>
    x?.label ? (
      <a className={`rv-endcta__btn rv-endcta__btn--${kind}`} href={x.href} {...(x.newTab ? { target: '_blank', rel: 'noopener' } : {})}>
        {x.label}
        <Arrow />
      </a>
    ) : null;
  return (
    <section className="rv-endcta">
      <div className="rv-endcta__panel">
        <p className="rv-endcta__eyebrow">{b.eyebrow}</p>
        <h2 className="rv-endcta__title">
          <Lines text={b.heading} />
        </h2>
        <p className="rv-endcta__text">
          <Lines text={b.text} />
        </p>
        <div className="rv-endcta__actions">
          {btn(b.primary, 'solid')}
          {btn(b.secondary, 'ghost')}
        </div>
      </div>
    </section>
  );
}

/* A decorative picture strip above some treatment heroes (its picture comes
   from the stylesheet unless one is uploaded). */
export type BannerBlock = { _type: 'banner'; _key: string; tag?: string; className?: string; image?: SanityImage };
export function Banner({ b }: { b: BannerBlock }) {
  const bg = imageUrl(b.image);
  const Tag = (b.tag === 'div' || b.tag === 'section' ? b.tag : 'header') as 'header';
  return <Tag className={b.className} style={bg ? { backgroundImage: `url("${bg}")` } : undefined}></Tag>;
}
