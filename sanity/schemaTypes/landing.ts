import { defineArrayMember, defineField, defineType } from 'sanity';
import { RocketIcon } from '@sanity/icons/Rocket';
import { BlockContentIcon } from '@sanity/icons/BlockContent';

/* Ad landing pages (/lp/<address>). Each page has its own design ("care" or
   "clinic", fixed per page) and a list of that design's sections - see
   components/landing. */

const str = (name: string, title: string, description?: string) => defineField({ name, title, type: 'string', description });
const txt = (name: string, title: string, rows = 2) => defineField({ name, title, type: 'text', rows, description: 'Press Enter for a line break.' });
const line = (name: string, title: string) => defineField({ name, title, type: 'textLine', description: 'Select words and click "Gold" to colour them like on the page.' });
const pic = (name: string, title: string) => defineField({ name, title, type: 'picture' });
const list = (name: string, title: string, of: string) => defineField({ name, title, type: 'array', of: [defineArrayMember({ type: of })] });
const strings = (name: string, title: string) => defineField({ name, title, type: 'array', of: [defineArrayMember({ type: 'string' })] });
type F = ReturnType<typeof defineField>;
const obj = (name: string, title: string, fields: F[], preview?: { title?: string; subtitle?: string; media?: string }) =>
  defineType({ name, title, type: 'object', fields, preview: preview ? { select: preview } : undefined });
const plain = (v?: { children?: { text?: string }[] }[]) => (v ?? []).map((b) => (b.children ?? []).map((c) => c.text).join('')).join(' ');
const section = (name: string, title: string, fields: F[], label?: (v: Record<string, unknown>) => string | undefined) =>
  defineType({
    name,
    title,
    type: 'object',
    icon: BlockContentIcon,
    fields,
    preview: {
      select: { a: 'title', b: 'eyebrow', c: 'tag', d: 'name' },
      prepare: (v) => ({ title: (label?.(v) ?? (typeof v.a === 'string' ? v.a : plain(v.a as never))) || (v.b as string) || (v.c as string) || title, subtitle: title }),
    },
  });

// ---- shared items ----------------------------------------------------------------
const point = obj('lpPoint', 'Point', [str('title', 'Title'), txt('text', 'Text')], { title: 'title', subtitle: 'text' });
const richPoint = obj('lpRichPoint', 'Point', [str('title', 'Title'), line('text', 'Text')], { title: 'title' });
const stat = obj('lpStat', 'Figure', [str('value', 'Number (e.g. 9+)'), str('label', 'Label')], { title: 'value', subtitle: 'label' });
const lineItem = obj('lpLine', 'Line', [line('text', 'Text')]);
const navLink = obj('lpLink', 'Link', [str('label', 'Text'), str('href', 'Link')], { title: 'label', subtitle: 'href' });

// ---- design "care" -----------------------------------------------------------------
const careBadge = obj(
  'careBadge',
  'Badge',
  [
    defineField({ name: 'icon', title: 'Icon', type: 'string', options: { list: [{ title: '✨ Stars', value: 'bi-stars text-warning' }, { title: '✔ Check', value: 'bi-patch-check-fill text-success' }] } }),
    str('text', 'Text'),
  ],
  { title: 'text' },
);
const careQualification = obj('careQualification', 'Qualification', [str('title', 'Degree'), str('detail', 'Where (optional)')], { title: 'title', subtitle: 'detail' });
const careService = obj('careService', 'Service', [pic('image', 'Picture'), str('title', 'Title'), txt('text', 'Text')], { title: 'title', media: 'image.image' });

const careNav = section('careNav', 'Top bar', [pic('logo', 'Logo'), str('phoneDisplay', 'Phone (shown)'), str('phoneTel', 'Phone (dialled, e.g. +918595856844)'), str('whatsappUrl', 'WhatsApp link'), str('whatsappDisplay', 'WhatsApp button text')], () => 'Top bar');
const careHero = section('careHero', 'Hero', [
  str('eyebrow', 'Small label'),
  str('title', 'Title'),
  strings('leads', 'Paragraphs'),
  str('experience', 'Experience line'),
  list('badges', 'Badges', 'careBadge'),
  str('callLabel', 'Call button text'),
  str('callHref', 'Call button link (tel:…)'),
  str('whatsappLabel', 'WhatsApp button text'),
  str('whatsappHref', 'WhatsApp button link'),
  str('trustStars', 'Stars'),
  str('trustText', 'Trust text'),
  pic('image', 'Picture'),
  line('doctorIntro', 'Doctor introduction'),
]);
const careAbout = section('careAbout', 'About the doctor', [
  pic('photo', 'Photo'),
  line('note', 'Note under the photo (Shift+Enter for a new line)'),
  str('eyebrow', 'Small label'),
  str('name', 'Name'),
  str('achievementLabel', 'Achievement label'),
  str('achievementTitle', 'Achievement'),
  str('achievementDetail', 'Achievement detail'),
  str('qualificationsTitle', 'Qualifications heading'),
  list('qualifications', 'Qualifications', 'careQualification'),
  str('experienceTitle', 'Experience heading'),
  line('experienceIntro', 'Experience intro'),
  strings('experience', 'Experience'),
]);
const careServices = section('careServices', 'Services', [str('eyebrow', 'Small label'), str('title', 'Title'), list('items', 'Services', 'careService')]);
const careConcerns = section('careConcerns', 'Challenges vs solutions', [
  str('eyebrow', 'Small label'),
  str('title', 'Title'),
  str('challengesTitle', 'Challenges heading'),
  list('challenges', 'Challenges', 'lpPoint'),
  str('solutionsTitle', 'Solutions heading'),
  list('solutions', 'Solutions', 'lpPoint'),
]);
const careTestimonials = section('careTestimonials', 'Before & after carousel', [
  str('eyebrow', 'Small label'),
  str('title', 'Title'),
  str('text', 'Text'),
  defineField({ name: 'images', title: 'Pictures', type: 'array', of: [defineArrayMember({ type: 'picture' })], options: { layout: 'grid' } }),
]);
const careFooter = section(
  'careFooter',
  'Footer',
  [
    pic('logo', 'Logo'),
    txt('text', 'Text'),
    str('linksTitle', 'Links heading'),
    list('links', 'Links', 'lpLink'),
    str('contactTitle', 'Contact heading'),
    str('phoneDisplay', 'Phone (shown)'),
    str('phoneTel', 'Phone (dialled)'),
    str('whatsappLabel', 'WhatsApp text'),
    str('whatsappHref', 'WhatsApp link'),
    str('location', 'Location'),
    str('copyright', 'Copyright'),
    str('floatingWhatsappHref', 'Floating WhatsApp button link'),
  ],
  () => 'Footer',
);

// ---- design "clinic" ---------------------------------------------------------------
const head = [str('tag', 'Small label'), line('title', 'Title (Shift+Enter for a new line)'), line('sub', 'Text under the title')];
const clinicService = obj('clinicService', 'Treatment', [str('icon', 'Icon (emoji)'), str('title', 'Title'), txt('text', 'Text')], { title: 'title', subtitle: 'icon' });
const clinicCtaButton = obj(
  'clinicCtaButton',
  'Button',
  [str('label', 'Text'), str('href', 'Link'), defineField({ name: 'style', title: 'Style', type: 'string', options: { list: [{ title: 'White', value: 'white' }, { title: 'Outline', value: 'ghost' }], layout: 'radio', direction: 'horizontal' } })],
  { title: 'label', subtitle: 'href' },
);
const clinicButton = obj(
  'clinicButton',
  'Button',
  [str('label', 'Text'), str('href', 'Link'), defineField({ name: 'style', title: 'Style', type: 'string', options: { list: [{ title: 'Purple', value: 'primary' }, { title: 'WhatsApp green', value: 'wa' }], layout: 'radio', direction: 'horizontal' } })],
  { title: 'label', subtitle: 'href' },
);
const clinicQualification = obj('clinicQualification', 'Qualification', [str('icon', 'Icon (emoji)'), line('text', 'Text')]);
const clinicUspCard = obj('clinicUspCard', 'Card', [str('value', 'Big number (e.g. 98%)'), str('label', 'Label'), line('text', 'Text')], { title: 'label', subtitle: 'value' });
const clinicCell = obj('clinicCell', 'Cell', [str('text', 'Text'), defineField({ name: 'cross', title: 'Show in red (✗)', type: 'boolean' })]);
const clinicRow = obj(
  'clinicRow',
  'Row',
  [
    str('feature', 'Feature'),
    str('reviva', 'Reviva'),
    defineField({ name: 'revivaTick', title: 'Reviva: show ✓', type: 'boolean' }),
    defineField({ name: 'generic', title: 'Generic clinic', type: 'clinicCell' }),
    defineField({ name: 'other', title: 'Parlour / spa', type: 'clinicCell' }),
  ],
  { title: 'feature', subtitle: 'reviva' },
);
const clinicTestimonial = obj(
  'clinicTestimonial',
  'Testimonial',
  [str('stars', 'Stars'), txt('text', 'Review', 4), line('keywords', 'Keywords line'), str('color', 'Avatar colour (e.g. #8B5C8A)'), str('initials', 'Initials'), str('name', 'Name'), str('detail', 'Place · treatment')],
  { title: 'name', subtitle: 'detail' },
);
const clinicGoogleReview = obj(
  'clinicGoogleReview',
  'Review',
  [str('color', 'Avatar colour'), str('initial', 'Initial'), str('name', 'Name'), str('date', 'When (e.g. 2 weeks ago · Google Maps)'), txt('text', 'Review', 4)],
  { title: 'name', subtitle: 'date' },
);
const clinicFaqItem = obj('clinicFaqItem', 'Question', [str('question', 'Question'), defineField({ name: 'answer', title: 'Answer', type: 'richText' })], { title: 'question' });

const clinicNav = section('clinicNav', 'Top bar', [str('brand', 'Name'), str('brandSub', 'Name (second part)'), str('callLabel', 'Call button text'), str('callHref', 'Call link'), str('waLabel', 'WhatsApp button text'), str('waHref', 'WhatsApp link')], () => 'Top bar');
const clinicHero = section('clinicHero', 'Hero', [str('badge', 'Badge'), line('title', 'Title'), line('sub', 'Text'), list('bullets', 'Numbered points', 'lpLine'), list('stats', 'Figures', 'lpStat'), pic('image', 'Picture'), txt('intro', 'Doctor introduction', 3)], (v) => plain(v.a as never));
const clinicReviewsBar = section('clinicReviewsBar', 'Rating bar', [str('score', 'Rating (e.g. 4.9)'), str('stars', 'Stars'), str('label', 'Rating text'), list('stats', 'Figures', 'lpStat')], () => 'Rating bar');
const clinicServices = section('clinicServices', 'Treatments', [...head, list('services', 'Treatments', 'clinicService')]);
const clinicCta = section('clinicCta', 'Call to action', [str('title', 'Title'), line('text', 'Text'), list('buttons', 'Buttons', 'clinicCtaButton')]);
const clinicDoctor = section('clinicDoctor', 'Doctor', [
  ...head,
  pic('image', 'Photo'),
  str('badge', 'Badge'),
  str('name', 'Name'),
  str('credentials', 'Credentials'),
  line('achievement', 'Achievement (Shift+Enter for a new line)'),
  list('qualifications', 'Qualifications', 'clinicQualification'),
  list('buttons', 'Buttons', 'clinicButton'),
]);
const clinicUsp = section('clinicUsp', 'Why choose us', [...head, list('cards', 'Cards', 'clinicUspCard')]);
const clinicConcerns = section('clinicConcerns', 'Problems vs solutions', [
  ...head,
  str('challengesTitle', 'Problems heading'),
  list('challenges', 'Problems', 'lpRichPoint'),
  str('solutionsTitle', 'Solutions heading'),
  list('solutions', 'Solutions', 'lpRichPoint'),
]);
const clinicCompare = section('clinicCompare', 'Comparison table', [...head, strings('headers', 'Column headings (4)'), list('rows', 'Rows', 'clinicRow')]);
const clinicResults = section('clinicResults', 'Before & after photos', [
  ...head,
  defineField({ name: 'images', title: 'Photos', type: 'array', of: [defineArrayMember({ type: 'picture' })], options: { layout: 'grid' } }),
  str('buttonLabel', 'Button text'),
  str('buttonHref', 'Button link'),
]);
const clinicTestimonials = section('clinicTestimonials', 'Patient stories', [...head, list('items', 'Stories', 'clinicTestimonial')]);
const clinicGoogleReviews = section('clinicGoogleReviews', 'Google reviews', [str('title', 'Title'), str('stars', 'Stars'), str('score', 'Rating line (e.g. 4.9 / 5 ·)'), str('summary', 'Rating text'), list('items', 'Reviews', 'clinicGoogleReview')]);
const clinicFaq = section('clinicFaq', 'FAQ', [...head, list('items', 'Questions', 'clinicFaqItem')]);
const clinicFinal = section('clinicFinal', 'Booking form', [
  str('icon', 'Icon (emoji)'),
  str('title', 'Title'),
  line('text', 'Text'),
  str('namePlaceholder', 'Name box hint'),
  str('phonePlaceholder', 'Phone box hint'),
  str('concernPlaceholder', 'Concern box hint'),
  strings('concerns', 'Concern choices'),
  str('buttonLabel', 'Button text'),
  str('callLabel', 'Call button text'),
  str('callHref', 'Call link'),
  str('waLabel', 'WhatsApp button text'),
  str('waHref', 'WhatsApp link'),
  str('note', 'Small note'),
]);
const clinicFooter = section(
  'clinicFooter',
  'Footer',
  [
    str('brand', 'Name'),
    str('brandSub', 'Name (second part)'),
    txt('description', 'Text', 3),
    str('callLabel', 'Call button text'),
    str('callHref', 'Call link'),
    str('waLabel', 'WhatsApp button text'),
    str('waHref', 'WhatsApp link'),
    str('treatmentsTitle', 'Treatments heading'),
    strings('treatments', 'Treatments'),
    str('contactTitle', 'Contact heading'),
    txt('address', 'Address', 3),
    str('phoneDisplay', 'Phone (shown)'),
    str('phoneHref', 'Phone link (tel:…)'),
    str('waText', 'WhatsApp text'),
    txt('hours', 'Opening hours', 2),
    str('copyright', 'Copyright'),
    str('tagline', 'Bottom line'),
  ],
  () => 'Footer',
);
const clinicFixedCta = section('clinicFixedCta', 'Sticky buttons (phones)', [str('waLabel', 'WhatsApp text'), str('waHref', 'WhatsApp link'), str('callLabel', 'Call text'), str('callHref', 'Call link')], () => 'Sticky buttons');

const CARE = ['careNav', 'careHero', 'careAbout', 'careServices', 'careConcerns', 'careTestimonials', 'careFooter'];
const CLINIC = [
  'clinicNav', 'clinicHero', 'clinicReviewsBar', 'clinicServices', 'clinicCta', 'clinicDoctor', 'clinicUsp', 'clinicConcerns',
  'clinicCompare', 'clinicResults', 'clinicTestimonials', 'clinicGoogleReviews', 'clinicFaq', 'clinicFinal', 'clinicFooter', 'clinicFixedCta',
];

export const landingPage = defineType({
  name: 'landingPage',
  title: 'Landing page',
  type: 'document',
  icon: RocketIcon,
  groups: [
    { name: 'content', title: 'Sections', default: true },
    { name: 'seo', title: 'Google & tracking' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Page name', type: 'string', group: 'content', validation: (r) => r.required() }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      group: 'content',
      // Only the sections of this page's design can be added.
      of: [...CARE, ...CLINIC].map((t) => defineArrayMember({ type: t })),
      validation: (r) =>
        r.custom((v, ctx) => {
          const design = (ctx.document as { design?: string })?.design;
          const allowed = design === 'clinic' ? CLINIC : CARE;
          const wrong = ((v ?? []) as { _type: string }[]).find((s) => !allowed.includes(s._type));
          return wrong ? `This page's design does not have a "${wrong._type}" section.` : true;
        }),
    }),
    defineField({ name: 'seoTitle', title: 'Page title (browser tab / Google)', type: 'string', group: 'seo' }),
    defineField({ name: 'metaDescription', title: 'Google description', type: 'text', rows: 3, group: 'seo' }),
    defineField({ name: 'gtmId', title: 'Google Tag Manager ID (for this ad page)', type: 'string', group: 'seo' }),
    defineField({ name: 'slug', title: 'Page address', type: 'slug', group: 'seo', description: 'The page is at /lp/<this value>.', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'design', type: 'string', hidden: true }),
  ],
  preview: { select: { title: 'title', slug: 'slug.current' }, prepare: ({ title, slug }) => ({ title, subtitle: `/lp/${slug ?? ''}` }) },
});

export const landingTypes = [
  point, richPoint, stat, lineItem, navLink,
  careBadge, careQualification, careService, careNav, careHero, careAbout, careServices, careConcerns, careTestimonials, careFooter,
  clinicService, clinicCtaButton, clinicButton, clinicQualification, clinicUspCard, clinicCell, clinicRow, clinicTestimonial, clinicGoogleReview, clinicFaqItem,
  clinicNav, clinicHero, clinicReviewsBar, clinicServices, clinicCta, clinicDoctor, clinicUsp, clinicConcerns, clinicCompare, clinicResults,
  clinicTestimonials, clinicGoogleReviews, clinicFaq, clinicFinal, clinicFooter, clinicFixedCta,
  landingPage,
];
