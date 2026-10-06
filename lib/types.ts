import type { Picture } from './image';

export type Link = { label: string; href: string };

export type NavColumn = {
  title: string;
  description?: string;
  feature?: boolean;
  links: Link[];
};

export type NavItem = { label: string; href?: string; columns?: NavColumn[] };

export type Location = { name: string; address: string; phoneDisplay: string; phoneTel: string };

export type SiteSettings = {
  logo: string;
  logoAlt: string;
  callDisplay: string;
  callTel: string;
  bookUrl: string;
  nav: NavItem[];
  footerBlurb: string;
  social: { facebook: string; instagram: string; youtube: string; x: string };
  footerTreatments: Link[];
  footerClinic: Link[];
  locations: Location[];
  email: string;
  hours: string;
  legal: Link[];
  bookLabel: string;
  bookLabelShort: string;
  footerHeadings: { treatments: string; clinic: string; visit: string; hours: string };
  copyright: string;
  notFound: { eyebrow: string; title: string; buttonLabel: string; buttonHref: string };
  whatsappUrl: string;
  /** Google & tracking */
  siteUrl: string;
  clinicName: string;
  gaId: string;
  gtmId: string;
  googleVerification: string;
  shareImage?: Picture;
  /** Consultation box under every blog post. */
  postCta: { eyebrow: string; title: string; text: string; altText: string; whatsappLabel: string; whatsappHref: string; bookLabel: string; bookHref: string };
  /** Blog sidebar texts and treatment links. */
  blogSidebar: {
    treatmentsTitle: string;
    treatments: Link[];
    ctaEyebrow: string;
    ctaTitle: string;
    ctaText: string;
    ctaButtonLabel: string;
    ctaButtonHref: string;
  };
};

/** What the page layout needs from any document (page or post). */
export type DocMeta = {
  _id: string;
  title: string;
  seoTitle?: string;
  metaDescription?: string;
  /** "Hide from Google" */
  noindex?: boolean;
  /** Overrides the site's share image for this page. */
  shareImage?: Picture;
  bodyClass?: string;
};

export type Page = DocMeta & {
  path: string;
  name?: string;
  /** Page-builder sections (components/blocks). */
  blocks?: { _type: string; _key: string; [k: string]: unknown }[];
  whatsapp?: boolean;
};
