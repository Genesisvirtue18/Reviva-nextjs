import { Inline, type Block, type RichValue } from '@/lib/rich';
import { pictureSrc, type Picture } from '@/lib/image';

/* Landing page design "care" (/lp/skin-care-clinic-in-noida): Bootstrap 5.3
   page with a before / after carousel. Markup and classes are the original
   page's, styled by public/lp/skin-care-clinic-in-noida/lp.css. */

const Line = ({ value }: { value?: RichValue }) => {
  const block = value?.find((b) => b._type === 'block') as Block | undefined;
  return block ? <Inline block={block} /> : null;
};
const Img = ({ p, className }: { p?: Picture; className?: string }) => <img src={pictureSrc(p)} alt={p?.alt ?? ''} className={className} />;
const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;
const poppins = { fontFamily: "'Poppins',sans-serif" };

export type CareNav = { _type: 'careNav'; _key: string; logo?: Picture; phoneDisplay?: string; phoneTel?: string; whatsappUrl?: string; whatsappDisplay?: string };
export function CareNavBlock({ b }: { b: CareNav }) {
  return (
    <nav className="navbar sticky-top site-nav py-2">
      <div className="container">
        <a className="navbar-brand d-flex align-items-center" href="#top">
          <Img p={b.logo} className="brand-logo" />
        </a>
        <div className="d-flex align-items-center gap-2 ms-auto">
          <a className="btn btn-outline-dark header-cta-btn" href={`tel:${b.phoneTel}`} aria-label={`Call ${b.phoneDisplay}`}>
            <i className="bi bi-telephone-fill"></i>
            <span className="cta-text">{b.phoneDisplay}</span>
          </a>
          <a className="btn btn-brand header-cta-btn" href={b.whatsappUrl} {...ext} aria-label={`WhatsApp ${b.whatsappDisplay}`}>
            <i className="bi bi-whatsapp"></i>
            <span className="cta-text">{b.whatsappDisplay}</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

export type CareHero = {
  _type: 'careHero';
  _key: string;
  eyebrow?: string;
  title?: string;
  leads?: string[];
  experience?: string;
  badges?: { _key: string; icon?: string; text?: string }[];
  callLabel?: string;
  callHref?: string;
  whatsappLabel?: string;
  whatsappHref?: string;
  trustStars?: string;
  trustText?: string;
  image?: Picture;
  doctorIntro?: RichValue;
};
export function CareHeroBlock({ b }: { b: CareHero }) {
  const leads = b.leads ?? [];
  return (
    <header className="hero" id="top">
      <div className="container">
        <div className="row g-4 g-lg-5 hero-layout">
          <div className="col-lg-6">
            <div className="hero-copy">
              <p className="eyebrow mb-3">{b.eyebrow}</p>
              <h1>{b.title}</h1>
              {leads.map((l, i) => (
                <p className={`hero-lead ${i === leads.length - 1 ? 'mb-4' : 'mb-2'}`} key={i}>
                  {l}
                </p>
              ))}
              <p className="hero-experience">{b.experience}</p>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {(b.badges ?? []).map((x) => (
                  <span className="hero-badge" key={x._key}>
                    <i className={`bi ${x.icon}`}></i>
                    {x.text}
                  </span>
                ))}
              </div>
              <div className="d-flex flex-wrap gap-2 mb-2">
                <a href={b.callHref} className="btn btn-brand btn-lg">
                  {b.callLabel}
                </a>
                <a href={b.whatsappHref} {...ext} className="btn hero-ghost-btn btn-lg">
                  {b.whatsappLabel}
                </a>
              </div>
              <div className="hero-trust-pill">
                <span className="hero-trust-stars">{b.trustStars}</span>
                <span>{b.trustText}</span>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="hero-image-wrap">
              <Img p={b.image} />
            </div>
            <div className="doctor-intro">
              <Line value={b.doctorIntro} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export type CareAbout = {
  _type: 'careAbout';
  _key: string;
  photo?: Picture;
  note?: RichValue;
  eyebrow?: string;
  name?: string;
  achievementLabel?: string;
  achievementTitle?: string;
  achievementDetail?: string;
  qualificationsTitle?: string;
  qualifications?: { _key: string; title?: string; detail?: string }[];
  experienceTitle?: string;
  experienceIntro?: RichValue;
  experience?: string[];
};
export function CareAboutBlock({ b }: { b: CareAbout }) {
  return (
    <section className="section-space pt-3" id="about">
      <div className="container">
        <div className="row g-0 about-card">
          <div className="col-lg-5">
            <div className="about-media">
              <div className="about-photo-wrap">
                <Img p={b.photo} className="about-photo" />
              </div>
              <div className="about-note">
                <Line value={b.note} />
              </div>
            </div>
          </div>
          <div className="col-lg-7">
            <div className="about-content">
              <p className="eyebrow mb-2">{b.eyebrow}</p>
              <h2 className="mb-3">{b.name}</h2>
              <div className="about-achievement mb-3">
                <strong style={{ color: '#7a5a0c', textTransform: 'uppercase' }}>{b.achievementLabel}</strong>
                <div className="mt-2 fw-semibold">{b.achievementTitle}</div>
                <div className="mt-1">{b.achievementDetail}</div>
              </div>
              <div className="about-grid mt-3">
                <div className="about-block">
                  <h5 className="about-subtitle">{b.qualificationsTitle}</h5>
                  <ul className="about-list">
                    {(b.qualifications ?? []).map((q) => (
                      <li key={q._key}>
                        <strong>{q.title}</strong>
                        <span className="subtext">{q.detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="about-block">
                  <h5 className="about-subtitle">{b.experienceTitle}</h5>
                  <p className="mb-2">
                    <Line value={b.experienceIntro} />
                  </p>
                  <ul className="about-list">
                    {(b.experience ?? []).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export type CareServices = { _type: 'careServices'; _key: string; eyebrow?: string; title?: string; items?: { _key: string; image?: Picture; title?: string; text?: string }[] };
export function CareServicesBlock({ b }: { b: CareServices }) {
  return (
    <section className="section-space" id="services">
      <div className="container">
        <div className="text-center mb-5">
          <p className="eyebrow mb-2">{b.eyebrow}</p>
          <h2>{b.title}</h2>
        </div>
        <div className="row g-4">
          {(b.items ?? []).map((s) => (
            <div className="col-md-6 col-lg-4" key={s._key}>
              <article className="service-card">
                <Img p={s.image} />
                <div className="card-body">
                  <h5 className="mb-2" style={poppins}>
                    {s.title}
                  </h5>
                  <p className="mb-0">{s.text}</p>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

type Point = { _key: string; title?: string; text?: string };
export type CareConcerns = {
  _type: 'careConcerns';
  _key: string;
  eyebrow?: string;
  title?: string;
  challengesTitle?: string;
  challenges?: Point[];
  solutionsTitle?: string;
  solutions?: Point[];
};
export function CareConcernsBlock({ b }: { b: CareConcerns }) {
  const panel = (title: string | undefined, items: Point[] | undefined, icon: string) => (
    <div className="col-lg-5">
      <h3 className="mb-3 text-white">{title}</h3>
      <div className="list-panel">
        {(items ?? []).map((x) => (
          <div className="list-item" key={x._key}>
            <h5>
              <i className={icon}></i>
              {x.title}
            </h5>
            <p className="mb-0">{x.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <section className="section-space pt-1" id="concerns">
      <div className="container">
        <div className="text-center mb-4">
          <p className="eyebrow mb-2">{b.eyebrow}</p>
          <h2>{b.title}</h2>
        </div>
        <div className="challenge-wrap">
          <div className="row g-4 align-items-stretch">
            {panel(b.challengesTitle, b.challenges, 'bi bi-x-lg icon-x')}
            <div className="col-lg-2 arrow-col">
              <i className="bi bi-arrow-right"></i>
            </div>
            {panel(b.solutionsTitle, b.solutions, 'bi bi-check-lg icon-check')}
          </div>
        </div>
      </div>
    </section>
  );
}

export type CareTestimonials = { _type: 'careTestimonials'; _key: string; eyebrow?: string; title?: string; text?: string; images?: (Picture & { _key: string })[] };
export function CareTestimonialsBlock({ b }: { b: CareTestimonials }) {
  return (
    <section className="section-space" id="testimonials">
      <div className="container">
        <div className="row g-4 align-items-center">
          <div className="col-lg-3">
            <div className="h-100 d-flex flex-column justify-content-center">
              <p className="eyebrow mb-2">{b.eyebrow}</p>
              <h2 className="mb-3">{b.title}</h2>
              <p className="mb-4">{b.text}</p>
            </div>
          </div>
          <div className="col-lg-9">
            <div className="testimonial-shell">
              <div className="owl-carousel owl-theme" id="beforeAfterCarousel">
                {(b.images ?? []).map((p) => (
                  <div className="item" key={p._key}>
                    <div className="testimonial-slide">
                      <Img p={p} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export type CareFooter = {
  _type: 'careFooter';
  _key: string;
  logo?: Picture;
  text?: string;
  linksTitle?: string;
  links?: { _key: string; label?: string; href?: string }[];
  contactTitle?: string;
  phoneDisplay?: string;
  phoneTel?: string;
  whatsappLabel?: string;
  whatsappHref?: string;
  location?: string;
  copyright?: string;
  floatingWhatsappHref?: string;
};
export function CareFooterBlock({ b }: { b: CareFooter }) {
  const h5 = { ...poppins, color: '#fff' };
  return (
    <>
      <footer className="footer">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-5">
              <Img p={b.logo} className="brand-logo mb-3" />
              <p className="mb-0">{b.text}</p>
            </div>
            <div className="col-sm-6 col-lg-3">
              <h5 style={h5}>{b.linksTitle}</h5>
              {(b.links ?? []).map((l) => (
                <p className="mb-1" key={l._key}>
                  <a href={l.href}>{l.label}</a>
                </p>
              ))}
            </div>
            <div className="col-sm-6 col-lg-4">
              <h5 style={h5}>{b.contactTitle}</h5>
              <p className="mb-1">
                <a href={`tel:${b.phoneTel}`}>{b.phoneDisplay}</a>
              </p>
              <p className="mb-1">
                <a href={b.whatsappHref} {...ext}>
                  {b.whatsappLabel}
                </a>
              </p>
              <p className="mb-0">{b.location}</p>
            </div>
          </div>
          <hr className="my-4" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
          <p className="mb-0 text-center">{b.copyright}</p>
        </div>
      </footer>
      {b.floatingWhatsappHref ? (
        <a href={b.floatingWhatsappHref} className="floating-whatsapp" {...ext} aria-label="Chat on WhatsApp">
          <i className="bi bi-whatsapp"></i>
        </a>
      ) : null}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CARE_BLOCKS: Record<string, (p: { b: any }) => React.ReactNode> = {
  careNav: CareNavBlock,
  careHero: CareHeroBlock,
  careAbout: CareAboutBlock,
  careServices: CareServicesBlock,
  careConcerns: CareConcernsBlock,
  careTestimonials: CareTestimonialsBlock,
  careFooter: CareFooterBlock,
};
