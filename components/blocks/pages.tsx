import { Inline, Lines, Rich, type Block, type RichValue } from '@/lib/rich';
import { pictureSrc, type Picture } from '@/lib/image';

/* Heroes, galleries and legal pages. Original markup and class names. */

const Stars = () => (
  <div className="shooting-stars">
    {[1, 2, 3, 4, 5].map((n) => (
      <div className={`star s${n}`} key={n}></div>
    ))}
  </div>
);

/** One rich line (a heading with gold <span> words and line breaks). */
const Line = ({ value }: { value?: RichValue }) => {
  const block = value?.find((b) => b._type === 'block') as Block | undefined;
  return block ? <Inline block={block} /> : null;
};

export type PageHeroBlock = {
  _type: 'pageHero';
  _key: string;
  design?: { section?: string; stars?: 'inside' | 'outside' };
  eyebrow?: string;
  title?: RichValue;
  text?: string;
};
export function PageHero({ b }: { b: PageHeroBlock }) {
  const d = b.design ?? {};
  return (
    <section className={d.section ?? 'contact-hero'}>
      {d.stars === 'outside' ? <Stars /> : null}
      <div className="hero-content">
        {d.stars === 'inside' ? <Stars /> : null}
        <p className="small-heading">{b.eyebrow}</p>
        <h1>
          <Line value={b.title} />
        </h1>
        <div className="line"></div>
        <p className="hero-text">
          <Lines text={b.text} />
        </p>
      </div>
    </section>
  );
}

export type LegalHeroBlock = { _type: 'legalHero'; _key: string; eyebrow?: string; title?: string };
export function LegalHero({ b }: { b: LegalHeroBlock }) {
  return (
    <section className="privacy-hero">
      <div className="privacy-top-line">
        <span></span>
        <h5>{b.eyebrow}</h5>
        <span></span>
      </div>
      <h1>
        <Lines text={b.title} />
      </h1>
      <div className="hero-line"></div>
    </section>
  );
}

export type LegalContentBlock = { _type: 'legalContent'; _key: string; updated?: string; clauses?: { _key: string; heading?: string; body?: RichValue }[] };
export function LegalContent({ b }: { b: LegalContentBlock }) {
  return (
    <section className="privacy-content">
      {b.updated ? <p className="updated-text">{b.updated}</p> : null}
      {(b.clauses ?? []).map((c) => (
        <div className="policy-block" key={c._key}>
          <h2>{c.heading}</h2>
          <Rich value={c.body} />
        </div>
      ))}
    </section>
  );
}

export type GalleryFiltersBlock = { _type: 'galleryFilters'; _key: string; links?: { _key: string; label?: string; href?: string }[] };
export function GalleryFilters({ b }: { b: GalleryFiltersBlock }) {
  return (
    <section className="filter-section">
      <div className="filter-buttons">
        {(b.links ?? []).map((l) => (
          <a className="filter-btn" href={l.href} key={l._key}>
            {l.label}
          </a>
        ))}
      </div>
    </section>
  );
}

export type GalleryGridBlock = { _type: 'galleryGrid'; _key: string; photos?: (Picture & { _key: string })[] };
export function GalleryGrid({ b }: { b: GalleryGridBlock }) {
  return (
    <section className="gallery-section">
      <div className="gallery-grid">
        {(b.photos ?? []).map((p) => (
          <div className="gallery-item" key={p._key}>
            <img src={pictureSrc(p)} alt={p.alt ?? ''} />
          </div>
        ))}
      </div>
    </section>
  );
}
