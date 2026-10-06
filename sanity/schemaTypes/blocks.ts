import { createElement, type ReactNode } from 'react';
import { defineArrayMember, defineField, defineType, type ArrayOptions } from 'sanity';
import { BlockContentIcon } from '@sanity/icons/BlockContent';
import { ImageIcon } from '@sanity/icons/Image';
import { ImagesIcon } from '@sanity/icons/Images';
import { StarIcon } from '@sanity/icons/Star';
import { HelpCircleIcon } from '@sanity/icons/HelpCircle';
import { OlistIcon } from '@sanity/icons/Olist';
import { BulbOutlineIcon } from '@sanity/icons/BulbOutline';
import { DocumentTextIcon } from '@sanity/icons/DocumentText';
import { LinkIcon } from '@sanity/icons/Link';
import { HomeIcon } from '@sanity/icons/Home';
import { ThListIcon } from '@sanity/icons/ThList';
import { ArrowRightIcon } from '@sanity/icons/ArrowRight';
import { ComponentIcon } from '@sanity/icons/Component';

/* Page-builder sections - one per component in components/blocks. Field
   names match what editors see on the website. `design` (hidden) records
   which of the old site's markup variants a section uses, so every page
   keeps its exact look. */

const design = defineField({ name: 'design', type: 'string', hidden: true });
const str = (name: string, title: string, description?: string) => defineField({ name, title, type: 'string', description });
const txt = (name: string, title: string, rows = 3) => defineField({ name, title, type: 'text', rows, description: 'Press Enter for a line break.' });
const rich = (name: string, title: string) => defineField({ name, title, type: 'richText' });
const line = (name: string, title: string) =>
  defineField({ name, title, type: 'textLine', description: 'To make words gold: select them and click "Gold". Press Shift+Enter for a line break.' });
const list = (name: string, title: string, of: string, options?: ArrayOptions) =>
  defineField({ name, title, type: 'array', of: [defineArrayMember({ type: of })], options });
const plain = (blocks?: { children?: { text?: string }[] }[]) =>
  (blocks ?? []).map((b) => (b.children ?? []).map((c) => c.text ?? '').join('')).join(' ').replace(/\s+/g, ' ').trim();

// ---- gold highlight --------------------------------------------------------------

const GOLD = '#c49a5a';
/* The site's gold word style (<span> inside headings). A decorator like Bold:
   text typed inside or at the end of gold text stays gold. */
export const goldDecorator = {
  title: 'Gold highlight',
  value: 'highlight',
  icon: () => createElement('span', { style: { color: GOLD, fontWeight: 700, fontSize: 12 } }, 'Gold'),
  component: ({ children }: { children?: ReactNode }) => createElement('span', { style: { color: GOLD } }, children),
};

/* One line of text with optional gold words (titles, card texts...). */
export const textLine = defineType({
  name: 'textLine',
  title: 'Text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{ title: 'Normal', value: 'normal' }],
      lists: [],
      marks: {
        decorators: [goldDecorator, { title: 'Bold', value: 'strong' }, { title: 'Italic', value: 'em' }],
        annotations: [
          defineArrayMember({
            name: 'link',
            title: 'Link',
            type: 'object',
            icon: LinkIcon,
            fields: [defineField({ name: 'href', title: 'URL', type: 'string' }), defineField({ name: 'attrs', type: 'string', hidden: true })],
          }),
        ],
      },
    }),
  ],
});

// ---- shared objects -----------------------------------------------------------

export const picture = defineType({
  name: 'picture',
  title: 'Picture',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({ name: 'image', type: 'image', description: 'Upload or drop a new picture to replace this one.' }),
    str('alt', 'Alt text (describe the picture, for Google & screen readers)'),
    defineField({ name: 'src', type: 'string', hidden: true }),
    defineField({ name: 'originalAssetId', type: 'string', hidden: true }),
  ],
  preview: { select: { media: 'image', alt: 'alt', src: 'src' }, prepare: ({ media, alt, src }) => ({ title: alt || src?.split('/').pop() || 'Picture', media }) },
});

export const linkItem = defineType({
  name: 'linkItem',
  title: 'Link',
  type: 'object',
  icon: LinkIcon,
  fields: [str('label', 'Text'), str('href', 'Link (e.g. /contact)')],
  preview: { select: { title: 'label', subtitle: 'href' } },
});

export const buttonLink = defineType({
  name: 'buttonLink',
  title: 'Button',
  type: 'object',
  options: { collapsible: true, collapsed: false },
  fields: [str('label', 'Button text'), str('href', 'Button link (e.g. /contact)'), defineField({ name: 'newTab', title: 'Open in a new tab', type: 'boolean' })],
});

/* Rich text for longer content: paragraphs, headings, lists, pictures. */
export const richText = defineType({
  name: 'richText',
  title: 'Text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Paragraph', value: 'normal' },
        { title: 'Heading 2', value: 'h2' },
        { title: 'Heading 3', value: 'h3' },
        { title: 'Heading 4', value: 'h4' },
        { title: 'Centered note', value: 'center' },
        { title: 'Highlighted paragraph', value: 'highlight' },
        { title: 'Centered line', value: 'centerLine' },
        { title: 'Text without paragraph', value: 'plain' },
        { title: 'Empty line', value: 'spacer' },
      ],
      lists: [
        { title: 'Bullets', value: 'bullet' },
        { title: 'Numbers', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
          { title: 'Underline', value: 'underline' },
          goldDecorator,
        ],
        annotations: [
          defineArrayMember({
            name: 'link',
            title: 'Link',
            type: 'object',
            icon: LinkIcon,
            fields: [str('href', 'URL', 'e.g. /contact, https://…, tel:+91…'), defineField({ name: 'attrs', type: 'string', hidden: true })],
          }),
          defineArrayMember({
            name: 'styled',
            title: 'Highlight (original style)',
            type: 'object',
            fields: [defineField({ name: 'tag', type: 'string', hidden: true }), defineField({ name: 'attrs', type: 'string', hidden: true })],
          }),
        ],
      },
    }),
    defineArrayMember({ type: 'figure' }),
  ],
});

export const figure = defineType({
  name: 'figure',
  title: 'Picture',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({ name: 'image', type: 'image' }),
    str('alt', 'Alt text'),
    defineField({ name: 'src', type: 'string', hidden: true }),
    defineField({ name: 'originalAssetId', type: 'string', hidden: true }),
    defineField({ name: 'className', type: 'string', hidden: true }),
  ],
  preview: { select: { media: 'image', title: 'alt' } },
});

// ---- treatment pages ------------------------------------------------------------

export const serviceHero = defineType({
  name: 'serviceHero',
  title: 'Hero (treatment)',
  type: 'object',
  icon: StarIcon,
  fields: [
    str('eyebrow', 'Small label above the title'),
    txt('title', 'Title', 2),
    txt('text', 'Text under the title', 2),
    defineField({ name: 'image', title: 'Background picture', type: 'image', description: 'Leave empty to keep the current background.' }),
    defineField({ name: 'heroClass', type: 'string', hidden: true }),
  ],
  preview: { select: { title: 'title' }, prepare: ({ title }) => ({ title: title || 'Hero', subtitle: 'Hero' }) },
});

export const overviewColumn = defineType({
  name: 'overviewColumn',
  title: 'Column',
  type: 'object',
  fields: [str('title', 'Column title'), defineField({ name: 'items', title: 'Points', type: 'array', of: [defineArrayMember({ type: 'string' })] })],
  preview: { select: { title: 'title', items: 'items' }, prepare: ({ title, items }) => ({ title, subtitle: `${items?.length ?? 0} points` }) },
});

export const serviceOverview = defineType({
  name: 'serviceOverview',
  title: 'Overview',
  type: 'object',
  icon: DocumentTextIcon,
  fields: [str('heading', 'Heading'), rich('body', 'Text'), list('columns', 'Columns (e.g. Key benefits / Who should opt)', 'overviewColumn')],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Overview', subtitle: 'Overview' }) },
});

export const procedureStep = defineType({
  name: 'procedureStep',
  title: 'Step',
  type: 'object',
  fields: [txt('text', 'Step', 2)],
  preview: { select: { title: 'text' } },
});

export const procedure = defineType({
  name: 'procedure',
  title: 'Procedure steps',
  type: 'object',
  icon: OlistIcon,
  fields: [design, str('heading', 'Heading'), list('steps', 'Steps (numbered automatically)', 'procedureStep')],
  preview: { select: { title: 'heading', steps: 'steps' }, prepare: ({ title, steps }) => ({ title: title || 'Procedure', subtitle: `Procedure · ${steps?.length ?? 0} steps` }) },
});

export const beforeAfter = defineType({
  name: 'beforeAfter',
  title: 'Before & after',
  type: 'object',
  icon: ImagesIcon,
  fields: [design, str('eyebrow', 'Small label'), txt('heading', 'Heading', 2), txt('text', 'Text', 2), str('buttonLabel', 'Button text'), str('buttonHref', 'Button link')],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Before & after', subtitle: 'Before & after' }) },
});

export const faqItem = defineType({
  name: 'faqItem',
  title: 'Question',
  type: 'object',
  icon: HelpCircleIcon,
  fields: [str('question', 'Question'), rich('answer', 'Answer')],
  preview: { select: { title: 'question' } },
});

export const faq = defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'object',
  icon: HelpCircleIcon,
  fields: [design, str('heading', 'Heading'), list('items', 'Questions', 'faqItem')],
  preview: { select: { title: 'heading', items: 'items' }, prepare: ({ title, items }) => ({ title: title || 'FAQ', subtitle: `FAQ · ${items?.length ?? 0} questions` }) },
});

export const ctaBanner = defineType({
  name: 'ctaBanner',
  title: 'Call to action',
  type: 'object',
  icon: ArrowRightIcon,
  fields: [
    str('eyebrow', 'Small label'),
    txt('heading', 'Heading', 2),
    txt('text', 'Text', 2),
    defineField({ name: 'primary', title: 'Main button', type: 'buttonLink' }),
    defineField({ name: 'secondary', title: 'Second button', type: 'buttonLink' }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: (title || 'Call to action').replace(/\n/g, ' '), subtitle: 'Call to action' }) },
});

export const banner = defineType({
  name: 'banner',
  title: 'Picture banner',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({ name: 'image', title: 'Picture', type: 'image', description: 'Leave empty to keep the current picture.' }),
    defineField({ name: 'tag', type: 'string', hidden: true }),
    defineField({ name: 'className', type: 'string', hidden: true }),
  ],
  preview: { prepare: () => ({ title: 'Picture banner' }) },
});

// ---- heroes, legal, galleries ----------------------------------------------------

export const pageHero = defineType({
  name: 'pageHero',
  title: 'Hero',
  type: 'object',
  icon: StarIcon,
  fields: [design, str('eyebrow', 'Small label'), line('title', 'Title'), txt('text', 'Text', 2)],
  preview: { select: { title: 'title' }, prepare: ({ title }) => ({ title: plain(title) || 'Hero', subtitle: 'Hero' }) },
});

export const legalHero = defineType({
  name: 'legalHero',
  title: 'Title (legal page)',
  type: 'object',
  icon: StarIcon,
  fields: [str('eyebrow', 'Small label'), txt('title', 'Title', 2)],
  preview: { select: { title: 'title' }, prepare: ({ title }) => ({ title: (title || 'Title').replace(/\n/g, ' '), subtitle: 'Title' }) },
});

export const legalClause = defineType({
  name: 'legalClause',
  title: 'Clause',
  type: 'object',
  fields: [str('heading', 'Heading'), rich('body', 'Text')],
  preview: { select: { title: 'heading' } },
});

export const legalContent = defineType({
  name: 'legalContent',
  title: 'Policy text',
  type: 'object',
  icon: DocumentTextIcon,
  fields: [str('updated', '"Last updated" line'), list('clauses', 'Clauses', 'legalClause')],
  preview: { select: { clauses: 'clauses' }, prepare: ({ clauses }) => ({ title: 'Policy text', subtitle: `${clauses?.length ?? 0} clauses` }) },
});

export const galleryFilters = defineType({
  name: 'galleryFilters',
  title: 'Gallery menu',
  type: 'object',
  icon: ThListIcon,
  fields: [list('links', 'Buttons', 'linkItem')],
  preview: { prepare: () => ({ title: 'Gallery menu', subtitle: 'Buttons linking the gallery pages' }) },
});

export const galleryGrid = defineType({
  name: 'galleryGrid',
  title: 'Photo gallery',
  type: 'object',
  icon: ImagesIcon,
  fields: [list('photos', 'Photos (drag to reorder)', 'picture', { layout: 'grid' })],
  preview: { select: { photos: 'photos', media: 'photos.0.image' }, prepare: ({ photos, media }) => ({ title: 'Photo gallery', subtitle: `${photos?.length ?? 0} photos`, media }) },
});

// ---- article pages -----------------------------------------------------------------

export const articleText = defineType({
  name: 'articleText',
  title: 'Text',
  type: 'object',
  icon: DocumentTextIcon,
  fields: [rich('body', 'Text')],
  preview: { select: { body: 'body' }, prepare: ({ body }) => ({ title: plain(body).slice(0, 80) || 'Text', subtitle: 'Text' }) },
});

export const articleBox = defineType({
  name: 'articleBox',
  title: 'Highlighted box',
  type: 'object',
  icon: BulbOutlineIcon,
  fields: [design, rich('body', 'Text')],
  preview: { select: { body: 'body' }, prepare: ({ body }) => ({ title: plain(body).slice(0, 80) || 'Box', subtitle: 'Highlighted box' }) },
});

export const articleCard = defineType({
  name: 'articleCard',
  title: 'Card',
  type: 'object',
  fields: [line('badge', 'Number / icon'), line('title', 'Title'), line('text', 'Text'), rich('body', 'Text (longer)')],
  preview: {
    select: { badge: 'badge', title: 'title', text: 'text', body: 'body' },
    prepare: ({ badge, title, text, body }) => ({ title: plain(title) || plain(text) || plain(body).slice(0, 60), subtitle: plain(badge) }),
  },
});

export const articleCards = defineType({
  name: 'articleCards',
  title: 'Cards',
  type: 'object',
  icon: ThListIcon,
  fields: [design, list('cards', 'Cards', 'articleCard')],
  preview: { select: { cards: 'cards' }, prepare: ({ cards }) => ({ title: 'Cards', subtitle: `${cards?.length ?? 0} cards` }) },
});

export const articleListItem = defineType({
  name: 'articleListItem',
  title: 'Point',
  type: 'object',
  fields: [line('text', 'Point')],
  preview: { select: { text: 'text' }, prepare: ({ text }) => ({ title: plain(text) }) },
});

export const articleList = defineType({
  name: 'articleList',
  title: 'Bullet list',
  type: 'object',
  icon: ThListIcon,
  fields: [design, list('items', 'Points', 'articleListItem')],
  preview: { select: { items: 'items' }, prepare: ({ items }) => ({ title: 'Bullet list', subtitle: `${items?.length ?? 0} points` }) },
});

export const articleImage = defineType({
  name: 'articleImage',
  title: 'Picture',
  type: 'object',
  icon: ImageIcon,
  fields: [design, defineField({ name: 'picture', type: 'picture' })],
  preview: { select: { media: 'picture.image' }, prepare: ({ media }) => ({ title: 'Picture', media }) },
});

export const articleButton = defineType({
  name: 'articleButton',
  title: 'Button',
  type: 'object',
  icon: ArrowRightIcon,
  fields: [design, str('label', 'Button text'), str('href', 'Button link'), defineField({ name: 'newTab', title: 'Open in a new tab', type: 'boolean' })],
  preview: { select: { title: 'label', subtitle: 'href' } },
});

export const articleCallout = defineType({
  name: 'articleCallout',
  title: 'Consultation box',
  type: 'object',
  icon: ArrowRightIcon,
  fields: [design, str('heading', 'Heading'), line('text', 'Text'), str('buttonLabel', 'Button text'), str('buttonHref', 'Button link')],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title, subtitle: 'Consultation box' }) },
});

export const articleSection = defineType({
  name: 'articleSection',
  title: 'Section',
  type: 'object',
  icon: BlockContentIcon,
  fields: [
    design,
    str('label', 'Small label'),
    line('heading', 'Heading'),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: ['articleText', 'articleCards', 'articleList', 'articleBox', 'articleImage', 'articleButton', 'articleCallout'].map((t) => defineArrayMember({ type: t })),
    }),
  ],
  preview: {
    select: { heading: 'heading', label: 'label', content: 'content' },
    prepare: ({ heading, label, content }) => ({ title: plain(heading) || label || 'Intro', subtitle: `${content?.length ?? 0} parts` }),
  },
});

export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'object',
  icon: DocumentTextIcon,
  fields: [
    design,
    defineField({ name: 'sections', title: 'Sections', type: 'array', of: [defineArrayMember({ type: 'articleSection' }), defineArrayMember({ type: 'customSection' })] }),
  ],
  preview: { select: { sections: 'sections' }, prepare: ({ sections }) => ({ title: 'Article', subtitle: `${sections?.length ?? 0} sections` }) },
});

// ---- home, reviews, treatments index, clinic pages, sitemap -------------------------

export const heroContact = defineType({
  name: 'heroContact',
  title: 'Phone',
  type: 'object',
  fields: [str('label', 'Clinic'), str('phone', 'Phone (shown)'), str('tel', 'Phone (dialled, e.g. +917827448711)')],
  preview: { select: { title: 'label', subtitle: 'phone' } },
});

export const heroStat = defineType({
  name: 'heroStat',
  title: 'Figure',
  type: 'object',
  fields: [str('value', 'Number (e.g. 10+)'), str('label', 'Label')],
  preview: { select: { title: 'value', subtitle: 'label' } },
});

export const homeHero = defineType({
  name: 'homeHero',
  title: 'Hero (home)',
  type: 'object',
  icon: HomeIcon,
  fields: [
    str('eyebrow', 'Small label'),
    line('title', 'Title'),
    txt('text', 'Text', 2),
    defineField({ name: 'primary', title: 'First button', type: 'buttonLink' }),
    defineField({ name: 'secondary', title: 'Second button', type: 'buttonLink' }),
    list('contacts', 'Phone numbers', 'heroContact'),
    list('stats', 'Figures', 'heroStat'),
  ],
  preview: { select: { title: 'title' }, prepare: ({ title }) => ({ title: plain(title) || 'Hero', subtitle: 'Hero' }) },
});

export const review = defineType({
  name: 'review',
  title: 'Review',
  type: 'object',
  icon: StarIcon,
  fields: [
    defineField({ name: 'stars', title: 'Stars', type: 'number', options: { list: [1, 2, 3, 4, 5] }, initialValue: 5 }),
    str('source', 'Source (e.g. GOOGLE REVIEW)'),
    txt('text', 'Review', 4),
    str('name', 'Patient name'),
    str('treatment', 'Treatment'),
  ],
  preview: { select: { title: 'name', subtitle: 'treatment' } },
});

export const reviews = defineType({
  name: 'reviews',
  title: 'Reviews',
  type: 'object',
  icon: StarIcon,
  fields: [list('reviews', 'Reviews', 'review')],
  preview: { select: { r: 'reviews' }, prepare: ({ r }) => ({ title: 'Reviews', subtitle: `${r?.length ?? 0} reviews` }) },
});

export const treatmentCard = defineType({
  name: 'treatmentCard',
  title: 'Treatment',
  type: 'object',
  fields: [defineField({ name: 'picture', type: 'picture' }), str('title', 'Title'), txt('text', 'Text', 2), str('linkLabel', 'Link text'), str('href', 'Link')],
  preview: { select: { title: 'title', media: 'picture.image' } },
});

export const treatmentCards = defineType({
  name: 'treatmentCards',
  title: 'Treatment cards',
  type: 'object',
  icon: ThListIcon,
  fields: [list('cards', 'Treatments', 'treatmentCard')],
  preview: { select: { c: 'cards' }, prepare: ({ c }) => ({ title: 'Treatment cards', subtitle: `${c?.length ?? 0} treatments` }) },
});

export const clinicIntro = defineType({
  name: 'clinicIntro',
  title: 'Clinic introduction',
  type: 'object',
  icon: HomeIcon,
  fields: [str('tag', 'Small label'), line('title', 'Title'), rich('body', 'Text'), defineField({ name: 'picture', type: 'picture' })],
  preview: { select: { title: 'title', media: 'picture.image' }, prepare: ({ title, media }) => ({ title: plain(title) || 'Clinic introduction', subtitle: 'Clinic introduction', media }) },
});

export const clinicGallery = defineType({
  name: 'clinicGallery',
  title: 'Clinic photos',
  type: 'object',
  icon: ImagesIcon,
  fields: [str('eyebrow', 'Small label'), str('heading', 'Heading'), list('photos', 'Photos (1 large, 2 beside it, 2 below)', 'picture', { layout: 'grid' })],
  preview: { select: { title: 'heading', media: 'photos.0.image' }, prepare: ({ title, media }) => ({ title: title || 'Clinic photos', subtitle: 'Clinic photos', media }) },
});

export const signatureCard = defineType({
  name: 'signatureCard',
  title: 'Treatment',
  type: 'object',
  fields: [str('title', 'Title'), txt('text', 'Text', 2)],
  preview: { select: { title: 'title' } },
});

export const signatureTreatments = defineType({
  name: 'signatureTreatments',
  title: 'Signature treatments',
  type: 'object',
  icon: StarIcon,
  fields: [str('eyebrow', 'Small label'), line('title', 'Title'), list('cards', 'Treatments (numbered automatically)', 'signatureCard')],
  preview: { select: { title: 'title' }, prepare: ({ title }) => ({ title: plain(title) || 'Signature treatments', subtitle: 'Signature treatments' }) },
});

export const linkGroup = defineType({
  name: 'linkGroup',
  title: 'Group',
  type: 'object',
  fields: [str('heading', 'Heading'), list('links', 'Links', 'linkItem')],
  preview: { select: { title: 'heading', links: 'links' }, prepare: ({ title, links }) => ({ title, subtitle: `${links?.length ?? 0} links` }) },
});

export const linkGroups = defineType({
  name: 'linkGroups',
  title: 'Link list (sitemap)',
  type: 'object',
  icon: LinkIcon,
  fields: [str('title', 'Title'), list('groups', 'Groups', 'linkGroup')],
  preview: { select: { title: 'title' }, prepare: ({ title }) => ({ title: title || 'Link list', subtitle: 'Link list' }) },
});

export const postGrid = defineType({
  name: 'postGrid',
  title: 'All blog posts (automatic)',
  type: 'object',
  icon: ThListIcon,
  fields: [defineField({ name: 'note', type: 'string', readOnly: true, initialValue: 'Shows every blog post, newest first.', description: 'Filled automatically from Blog posts.' })],
  preview: { prepare: () => ({ title: 'All blog posts', subtitle: 'Filled automatically from Blog posts' }) },
});

export const spacer = defineType({
  name: 'spacer',
  title: 'Empty line',
  type: 'object',
  fields: [defineField({ name: 'note', type: 'string', hidden: true })],
  preview: { prepare: () => ({ title: '— empty line —' }) },
});

export const customSection = defineType({
  name: 'customSection',
  title: 'Section (fixed design)',
  type: 'object',
  icon: ComponentIcon,
  fields: [
    defineField({ name: 'title', type: 'string', readOnly: true }),
    defineField({ name: 'groups', title: 'Text & pictures', type: 'array', of: [defineArrayMember({ type: 'pageSection' })], options: { sortable: false, disableActions: ['add', 'addBefore', 'addAfter', 'remove', 'duplicate', 'copy'] } }),
    defineField({ name: 'templateHtml', type: 'text', hidden: true }),
  ],
  preview: { select: { title: 'title' }, prepare: ({ title }) => ({ title: title || 'Section', subtitle: 'Fixed design - text & pictures editable' }) },
});

/** The page builder field. */
export const PAGE_BLOCKS = [
  'homeHero', 'serviceHero', 'pageHero', 'legalHero', 'banner',
  'serviceOverview', 'procedure', 'beforeAfter', 'faq', 'ctaBanner',
  'article', 'legalContent', 'galleryFilters', 'galleryGrid',
  'reviews', 'treatmentCards', 'clinicIntro', 'clinicGallery', 'signatureTreatments',
  'linkGroups', 'postGrid', 'spacer', 'customSection',
];

export const blockTypes = [
  textLine, picture, linkItem, buttonLink, richText, figure,
  serviceHero, overviewColumn, serviceOverview, procedureStep, procedure, beforeAfter, faqItem, faq, ctaBanner, banner,
  pageHero, legalHero, legalClause, legalContent, galleryFilters, galleryGrid,
  articleText, articleBox, articleCard, articleCards, articleListItem, articleList, articleImage, articleButton, articleCallout, articleSection, article,
  heroContact, heroStat, homeHero, review, reviews, treatmentCard, treatmentCards, clinicIntro, clinicGallery, signatureCard, signatureTreatments,
  linkGroup, linkGroups, postGrid, spacer, customSection,
];
