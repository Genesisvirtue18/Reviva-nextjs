import { Rich, type RichValue } from '@/lib/rich';
import { pictureSrc, type Picture } from '@/lib/image';
import type { SiteSettings } from '@/lib/types';

/* Blog posts, the blog index and the parts every post shares (consultation
   box, previous/next links, sidebar). The shared parts are generated: latest
   posts and previous/next come from the posts themselves, their texts from
   Site Settings. Markup is the original site's. */

export type PostDesign = {
  outer?: 'blog-page' | 'main-wrapper';
  container?: boolean;
  left?: boolean;
  leftClass?: string;
  titleClass?: string;
  image?: 'featured' | 'wrapped' | 'class';
};
export type Post = {
  _id: string;
  title: string;
  path: string;
  author?: string;
  publishedAt?: string;
  readMinutes?: number;
  excerpt?: string;
  cover?: Picture;
  body?: RichValue;
  design?: PostDesign;
};
export type PostCard = Pick<Post, 'title' | 'path' | 'publishedAt' | 'readMinutes' | 'excerpt' | 'cover'>;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const parts = (iso?: string) => {
  const [y, m, d] = (iso ?? '').split('-').map(Number);
  return { y, m: (m || 1) - 1, d };
};
/** "April 17, 2025" (classic posts) / "1 Jan, 2026" (newer posts). */
export const postDate = (iso: string | undefined, long: boolean) => {
  if (!iso) return '';
  const { y, m, d } = parts(iso);
  return long ? `${MONTHS[m]} ${d}, ${y}` : `${d} ${MONTHS[m].slice(0, 3)}, ${y}`;
};
/** "25 DEC 2026" (cards and sidebar). */
export const cardDate = (iso?: string) => {
  if (!iso) return '';
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS[m].slice(0, 3).toUpperCase()} ${y}`;
};

const ArrowRight = ({ w = 18, h = 11, sw = 1.4 }: { w?: number; h?: number; sw?: number }) => (
  <svg viewBox="0 0 20 12" width={w} height={h} aria-hidden="true" focusable="false">
    <path d="M0 6h17M12.5 1 17.5 6l-5 5" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ArrowLeft = () => (
  <svg viewBox="0 0 20 12" width="18" height="11" aria-hidden="true" focusable="false">
    <path d="M20 6H3M7.5 1 2.5 6l5 5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PHONE = 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2Z';

/** Consultation box + previous/next article links under every post. */
function PostEnd({ s, prev, next }: { s: SiteSettings; prev?: PostCard; next?: PostCard }) {
  const c = s.postCta;
  return (
    <div className="rv-pe">
      <div className="rv-pe-cta">
        <div className="rv-pe-cta__intro">
          <div className="rv-pe-cta__eyebrow">{c.eyebrow}</div>
          <h2 className="rv-pe-cta__title">{c.title}</h2>
          <div className="rv-pe-cta__text">{c.text}</div>
        </div>
        <div className="rv-pe-cta__lines">
          {s.locations.map((loc) => (
            <a className="rv-pe-line" href={`tel:${loc.phoneTel}`} aria-label={`Call the ${loc.name.replace(/ Clinic$/i, '')} clinic on ${loc.phoneDisplay}`} key={loc.name}>
              <span className="rv-pe-line__body">
                <span className="rv-pe-line__where">{loc.name.replace(/ Clinic$/i, '')}</span>
                <span className="rv-pe-line__num">{loc.phoneDisplay}</span>
              </span>
              <span className="rv-pe-line__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="17" height="17" focusable="false">
                  <path d={PHONE} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </a>
          ))}
        </div>
        <div className="rv-pe-cta__alt">
          {c.altText}{' '}
          <a href={c.whatsappHref} target="_blank" rel="noopener">
            {c.whatsappLabel}
          </a>{' '}
          or <a href={c.bookHref}>{c.bookLabel}</a>.
        </div>
      </div>
      {prev || next ? (
        <nav className="rv-pe-nav" aria-label="More articles">
          {prev ? (
            <a className="rv-pe-nav__link rv-pe-nav__link--prev" href={prev.path} rel="prev">
              <span className="rv-pe-nav__label">
                <ArrowLeft />
                Previous article
              </span>
              <span className="rv-pe-nav__title">{prev.title}</span>
            </a>
          ) : null}
          {next ? (
            <a className="rv-pe-nav__link rv-pe-nav__link--next" href={next.path} rel="next">
              <span className="rv-pe-nav__label">
                Next article
                <ArrowRight />
              </span>
              <span className="rv-pe-nav__title">{next.title}</span>
            </a>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}

function Sidebar({ s, latest }: { s: SiteSettings; latest: PostCard[] }) {
  const c = s.blogSidebar;
  return (
    <aside className="rv-bs" aria-label="More from the Reviva journal">
      <form className="rv-bs-card rv-bs-search" role="search" method="get" action="/blogs">
        <label className="rv-bs-card__title" htmlFor="rv-bs-q">
          Search
        </label>
        <div className="rv-bs-search__field">
          <input className="rv-bs-search__input" id="rv-bs-q" type="search" name="q" defaultValue="" placeholder="Search articles…" autoComplete="off" />
          <button className="rv-bs-search__btn" type="submit" aria-label="Search articles">
            <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true" focusable="false">
              <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12.8 12.8 17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </form>
      <section className="rv-bs-card">
        <h2 className="rv-bs-card__title">Latest Articles</h2>
        <ul className="rv-bs-posts">
          {latest.map((p) => {
            const img = pictureSrc(p.cover);
            return (
              <li key={p.path}>
                <a className="rv-bs-post" href={p.path}>
                  {img ? (
                    <span className="rv-bs-post__frame">
                      <img src={img} alt="" width="150" height="150" loading="lazy" decoding="async" />
                    </span>
                  ) : null}
                  <span className="rv-bs-post__body">
                    <span className="rv-bs-post__title">{p.title}</span>
                    <time className="rv-bs-post__date" dateTime={p.publishedAt}>
                      {cardDate(p.publishedAt)}
                    </time>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
        <a className="rv-bs-more" href="/blogs">
          All articles
          <ArrowRight />
        </a>
      </section>
      <section className="rv-bs-card">
        <h2 className="rv-bs-card__title">{c.treatmentsTitle}</h2>
        <ul className="rv-bs-links">
          {c.treatments.map((l) => (
            <li key={l.href}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ul>
      </section>
      <section className="rv-bs-cta">
        <p className="rv-bs-cta__eyebrow">{c.ctaEyebrow}</p>
        <h2 className="rv-bs-cta__title">{c.ctaTitle}</h2>
        <p className="rv-bs-cta__text">{c.ctaText}</p>
        <a className="rv-bs-cta__btn" href={c.ctaButtonHref}>
          {c.ctaButtonLabel}
        </a>
        <a className="rv-bs-cta__tel" href={`tel:${s.callTel}`}>
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false">
            <path d={PHONE} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {s.callDisplay}
        </a>
      </section>
    </aside>
  );
}

export function PostView({ post, s, latest, prev, next }: { post: Post; s: SiteSettings; latest: PostCard[]; prev?: PostCard; next?: PostCard }) {
  const d = post.design ?? {};
  const long = d.outer !== 'main-wrapper' && d.image === 'featured';
  const src = pictureSrc(post.cover);
  const alt = post.cover?.alt;
  const image =
    !src ? null : d.image === 'wrapped' ? (
      <div className="blog-image">
        <img src={src} alt={alt} />
      </div>
    ) : d.image === 'class' ? (
      <img src={src} className="blog-image" alt={alt} />
    ) : (
      <img src={src} className="featured-image" alt={alt} />
    );
  const article = (
    <>
      <h1 className={d.titleClass}>{post.title}</h1>
      <div className="blog-meta">
        <span>{post.author}</span>
        <span>{postDate(post.publishedAt, long)}</span>
      </div>
      {image}
      <div className="blog-content">
        <Rich value={post.body} />
      </div>
      <PostEnd s={s} prev={prev} next={next} />
    </>
  );
  const columns = (
    <>
      {d.left === false ? article : <div className={d.leftClass ?? 'blog-left'}>{article}</div>}
      <Sidebar s={s} latest={latest} />
    </>
  );
  const inner = d.container ? <div className="blog-container">{columns}</div> : columns;
  return d.outer === 'main-wrapper' ? <div className="main-wrapper">{inner}</div> : <section className="blog-page">{inner}</section>;
}

/** The grid of all posts on /blogs. */
const FIRST_BATCH = 12;

export function PostGrid({ posts }: { posts: PostCard[] }) {
  return (
    <section className="blog-section">
      <div className="blog-grid">
        {posts.map((p, i) => {
          const img = pictureSrc(p.cover);
          return (
            <a className="blog-card" href={p.path} key={p.path} {...(i >= FIRST_BATCH ? { 'data-more': '' } : {})}>
              <span className="blog-card__frame">{img ? <img src={img} alt="" width="600" height="400" loading="lazy" decoding="async" /> : null}</span>
              <span className="blog-card__body">
                <span className="blog-card__meta">
                  <time dateTime={p.publishedAt}>{cardDate(p.publishedAt)}</time>
                  <span className="blog-card__sep" aria-hidden="true"></span>
                  <span>{p.readMinutes ?? 3} min read</span>
                </span>
                <h3>{p.title}</h3>
                <p>{p.excerpt}</p>
                <span className="blog-card__cta">
                  Read article
                  <ArrowRight w={20} h={12} sw={1.3} />
                </span>
              </span>
            </a>
          );
        })}
      </div>
      {/* Revealed and wired up by the /blogs page script when there are more posts. */}
      <div className="blog-more">
        <button type="button" className="blog-more__btn" id="loadMore" hidden>
          Load more articles <span className="blog-more__count"></span>
        </button>
      </div>
    </section>
  );
}
