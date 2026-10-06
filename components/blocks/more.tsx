import { GalleryFilters, GalleryGrid, LegalContent, LegalHero, PageHero } from './pages';
import { Article } from './article';
import { ContactSection } from './contact';
import { ClinicGallery, ClinicIntro, HomeHero, LinkGroups, Reviews, SignatureTreatments, TreatmentCards } from './places';

/* Section components beyond the treatment pages (heroes, galleries,
   articles...). Registered into the page builder by components/blocks. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BLOCKS_MORE: Record<string, (props: { b: any }) => React.ReactNode> = {
  pageHero: PageHero,
  legalHero: LegalHero,
  legalContent: LegalContent,
  galleryFilters: GalleryFilters,
  galleryGrid: GalleryGrid,
  article: Article,
  homeHero: HomeHero,
  reviews: Reviews,
  treatmentCards: TreatmentCards,
  clinicIntro: ClinicIntro,
  clinicGallery: ClinicGallery,
  signatureTreatments: SignatureTreatments,
  linkGroups: LinkGroups,
  contactSection: ContactSection,
};
