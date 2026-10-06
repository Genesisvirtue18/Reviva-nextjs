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
  bodyClass?: string;
  headHtml?: string;
  bodyStartHtml?: string;
  bodyEndHtml?: string;
};

export type Page = DocMeta & {
  path: string;
  pageType?: 'page' | 'blog';
  name?: string;
  /** Page-builder sections (components/blocks). */
  blocks?: { _type: string; _key: string; [k: string]: unknown }[];
  whatsapp?: boolean;
  scriptsHtml?: string;
  /** Old-site HTML: only used by the offline copy in content/pages. */
  contentHtml: string;
  /** Layout with data-cms slots; when set, the page is built from `sections`. */
  templateHtml?: string;
  sections?: PageSection[];
};

/* Editable page fields (see scripts/lib/html-fields.mjs). */
export type PortableSpan = { _type: 'span'; _key: string; text: string; marks?: string[] };
export type PortableInline = { _type: 'inlineHtml'; _key: string; html: string };
export type MarkDef = { _key: string; _type: 'link' | 'styled'; href?: string; tag?: string; attrs?: string };
export type PortableBlock = { _type: 'block'; _key: string; markDefs?: MarkDef[]; children?: (PortableSpan | PortableInline)[] };

export type TextItem = { _type: 'textItem'; _key: string; label?: string; content?: PortableBlock[]; href?: string };
export type ImageItem = {
  _type: 'imageItem';
  _key: string;
  image?: { asset?: { _ref: string } };
  originalSrc?: string;
  originalAssetId?: string;
  alt?: string;
};
export type PageSection = { _type: 'pageSection'; _key: string; title?: string; items?: (TextItem | ImageItem)[] };

export type Redirect = { source: string; destination: string };
