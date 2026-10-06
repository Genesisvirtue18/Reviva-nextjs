import { Inline, Lines, Rich, type Block, type RichValue } from '@/lib/rich';
import { pictureSrc, type Picture } from '@/lib/image';

/* Home hero, reviews, treatments index, the Noida / Ghaziabad clinic pages
   and the sitemap page. Original markup and class names. */

const Line = ({ value }: { value?: RichValue }) => {
  const block = value?.find((b) => b._type === 'block') as Block | undefined;
  return block ? <Inline block={block} /> : null;
};
const Img = ({ p }: { p?: Picture }) => <img src={pictureSrc(p)} alt={p?.alt ?? ''} />;
const num = (i: number) => String(i + 1).padStart(2, '0');

type HeroButton = { label?: string; href?: string; newTab?: boolean };
const newTab = (b?: HeroButton) => (b?.newTab ? { target: '_blank', rel: 'noopener' } : {});

export type HomeHeroBlock = {
  _type: 'homeHero';
  _key: string;
  eyebrow?: string;
  title?: RichValue;
  text?: string;
  primary?: HeroButton;
  secondary?: HeroButton;
  contacts?: { _key: string; label?: string; phone?: string; tel?: string }[];
  stats?: { _key: string; value?: string; label?: string }[];
};
export function HomeHero({ b }: { b: HomeHeroBlock }) {
  return (
    <header className="hero">
      <div className="hero-overlay"></div>
      <div className="particles"></div>
      <div className="hero-content">
        <p className="subheading">{b.eyebrow}</p>
        <h1>
          <Line value={b.title} />
        </h1>
        <p className="hero-text">
          <Lines text={b.text} />
        </p>
        <div className="hero-buttons">
          {b.primary?.label ? (
            <a href={b.primary.href} className="primary-btn" {...newTab(b.primary)}>
              {b.primary.label}
            </a>
          ) : null}
          {b.secondary?.label ? (
            <a href={b.secondary.href} className="secondary-btn" {...newTab(b.secondary)}>
              {b.secondary.label}
            </a>
          ) : null}
        </div>
        <div className="hero-contact-strip">
          {(b.contacts ?? []).flatMap((c, i) => [
            ...(i ? [<div className="hero-contact-line" key={`l${c._key}`}></div>] : []),
            <div className="hero-contact-item" key={c._key}>
              <span>{c.label}</span>
              <a href={`tel:${c.tel}`}>{c.phone}</a>
            </div>,
          ])}
        </div>
        <div className="hero-stats">
          {(b.stats ?? []).map((s) => (
            <div key={s._key}>
              <h3>{s.value}</h3>
              <p>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

export type ReviewsBlock = {
  _type: 'reviews';
  _key: string;
  reviews?: { _key: string; stars?: number; source?: string; text?: string; name?: string; treatment?: string }[];
};
export function Reviews({ b }: { b: ReviewsBlock }) {
  return (
    <section className="reviews-section">
      <div className="reviews-grid">
        {(b.reviews ?? []).map((r) => (
          <div className="review-card" key={r._key}>
            <div className="review-top">
              <div className="stars">{'★'.repeat(r.stars ?? 5)}</div>
              <span>{r.source}</span>
            </div>
            <p className="review-text">
              <Lines text={r.text} />
            </p>
            <div className="review-bottom">
              <h4>{r.name}</h4>
              <small>{r.treatment}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export type TreatmentCardsBlock = {
  _type: 'treatmentCards';
  _key: string;
  cards?: { _key: string; picture?: Picture; title?: string; text?: string; linkLabel?: string; href?: string }[];
};
export function TreatmentCards({ b }: { b: TreatmentCardsBlock }) {
  return (
    <section className="treatments-section">
      <div className="treatments-grid">
        {(b.cards ?? []).map((c) => (
          <div className="treatment-card" key={c._key}>
            <div className="card-image">
              <Img p={c.picture} />
            </div>
            <div className="card-content">
              <h3>{c.title}</h3>
              <p>
                <Lines text={c.text} />
              </p>
              <a href={c.href}>{c.linkLabel}</a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export type ClinicIntroBlock = { _type: 'clinicIntro'; _key: string; tag?: string; title?: RichValue; body?: RichValue; picture?: Picture };
export function ClinicIntro({ b }: { b: ClinicIntroBlock }) {
  return (
    <section className="reviva-noida-sanctuary">
      <div className="reviva-noida-wrapper">
        <div className="reviva-noida-content">
          <span className="reviva-noida-tag">{b.tag}</span>
          <h2 className="reviva-noida-title">
            <Line value={b.title} />
          </h2>
          <div className="reviva-noida-line"></div>
          <Rich value={b.body} />
        </div>
        <div className="reviva-noida-image-box">
          <Img p={b.picture} />
        </div>
      </div>
    </section>
  );
}

/** Clinic photo collage: one large photo, two beside it, two below. */
export type ClinicGalleryBlock = { _type: 'clinicGallery'; _key: string; eyebrow?: string; heading?: string; photos?: (Picture & { _key: string })[] };
export function ClinicGallery({ b }: { b: ClinicGalleryBlock }) {
  const [big, side1, side2, ...bottom] = b.photos ?? [];
  return (
    <section className="reviva-gallery-sec">
      <div className="reviva-gallery-head">
        <span>{b.eyebrow}</span>
        <h2>{b.heading}</h2>
      </div>
      <div className="reviva-gallery-grid">
        <div className="reviva-gallery-big">
          <Img p={big} />
        </div>
        <div className="reviva-gallery-side">
          {[side1, side2].map((p, i) => (
            <div className="reviva-gallery-small" key={i}>
              <Img p={p} />
            </div>
          ))}
        </div>
        {bottom.map((p) => (
          <div className="reviva-gallery-small-bottom" key={p._key}>
            <Img p={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

export type SignatureTreatmentsBlock = {
  _type: 'signatureTreatments';
  _key: string;
  eyebrow?: string;
  title?: RichValue;
  cards?: { _key: string; title?: string; text?: string }[];
};
export function SignatureTreatments({ b }: { b: SignatureTreatmentsBlock }) {
  return (
    <section className="reviva-signature-wrap">
      <div className="reviva-signature-heading">
        <span className="reviva-signature-subtitle">{b.eyebrow}</span>
        <h2>
          <Line value={b.title} />
        </h2>
      </div>
      <div className="reviva-signature-grid">
        {(b.cards ?? []).map((c, i) => (
          <div className="reviva-treatment-card" key={c._key}>
            <span className="reviva-treatment-number">{num(i)}</span>
            <h3>{c.title}</h3>
            <p>
              <Lines text={c.text} />
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export type LinkGroupsBlock = {
  _type: 'linkGroups';
  _key: string;
  title?: string;
  groups?: { _key: string; heading?: string; links?: { _key: string; label?: string; href?: string }[] }[];
};
export function LinkGroups({ b }: { b: LinkGroupsBlock }) {
  return (
    <div className="sitemap-container">
      <h1>{b.title}</h1>
      {(b.groups ?? []).map((g) => (
        <div className="sitemap-section" key={g._key}>
          <h2>{g.heading}</h2>
          <div className="sitemap-links">
            {(g.links ?? []).map((l) => (
              <a href={l.href} key={l._key}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
