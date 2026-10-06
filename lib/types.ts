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
};

export type Page = {
  _id: string;
  path: string;
  pageType: 'page' | 'blog';
  title: string;
  metaDescription?: string;
  bodyClass?: string;
  headHtml?: string;
  bodyStartHtml?: string;
  contentHtml: string;
  bodyEndHtml?: string;
};
