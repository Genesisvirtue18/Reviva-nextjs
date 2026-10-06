import { defineArrayMember, defineField, defineType, type ArrayOptions } from 'sanity';
import { BlockContentIcon } from '@sanity/icons/BlockContent';
import { ImageIcon } from '@sanity/icons/Image';
import { TextIcon } from '@sanity/icons/Text';
import { LinkIcon } from '@sanity/icons/Link';
import { SparklesIcon } from '@sanity/icons/Sparkles';
import { CodeIcon } from '@sanity/icons/Code';

/* The editable content of a page: sections of text and image fields,
   generated from the original HTML by scripts/lib/html-fields.mjs and put
   back into the layout by lib/render-fields.ts. The layout itself is fixed,
   so items can be edited but not added, removed or reordered. */

const LOCKED: ArrayOptions = { sortable: false, disableActions: ['add', 'addBefore', 'addAfter', 'remove', 'duplicate', 'copy'] };

type Block = { _type: string; children?: { _type: string; text?: string }[] };
const toPlain = (blocks?: Block[]) =>
  (blocks ?? [])
    .map((b) => (b.children ?? []).map((c) => (c._type === 'span' ? c.text : '')).join(''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

// Icons and other fixed markup inside a line of text.
export const inlineHtml = defineType({
  name: 'inlineHtml',
  title: 'Icon',
  type: 'object',
  icon: CodeIcon,
  readOnly: true,
  fields: [defineField({ name: 'html', type: 'text', hidden: true })],
  preview: { prepare: () => ({ title: 'icon' }) },
});

export const richLine = defineType({
  name: 'richLine',
  title: 'Text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{ title: 'Normal', value: 'normal' }],
      lists: [],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
          { title: 'Underline', value: 'underline' },
        ],
        annotations: [
          defineArrayMember({
            name: 'link',
            title: 'Link',
            type: 'object',
            icon: LinkIcon,
            fields: [
              defineField({ name: 'href', title: 'URL', type: 'string', description: 'e.g. /contact, https://…, tel:+91…' }),
              defineField({ name: 'attrs', type: 'string', hidden: true }),
            ],
          }),
          defineArrayMember({
            name: 'styled',
            title: 'Highlight (original style)',
            type: 'object',
            icon: SparklesIcon,
            fields: [
              defineField({ name: 'tag', type: 'string', hidden: true }),
              defineField({ name: 'attrs', type: 'string', hidden: true }),
            ],
          }),
        ],
      },
      of: [defineArrayMember({ type: 'inlineHtml' })],
    }),
  ],
});

export const textItem = defineType({
  name: 'textItem',
  title: 'Text',
  type: 'object',
  icon: TextIcon,
  fields: [
    defineField({ name: 'content', title: 'Text', type: 'richLine' }),
    defineField({
      name: 'href',
      title: 'Button / link URL',
      type: 'string',
      hidden: ({ parent }) => parent?.href === undefined,
    }),
    defineField({ name: 'label', type: 'string', hidden: true }),
  ],
  preview: {
    select: { content: 'content', label: 'label', href: 'href' },
    prepare: ({ content, label, href }) => ({
      title: toPlain(content) || '(empty)',
      subtitle: [label, href].filter(Boolean).join(' → '),
    }),
  },
});

export const imageItem = defineType({
  name: 'imageItem',
  title: 'Image',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'image',
      type: 'image',
      description: 'Upload or drop a new picture to replace this one.',
    }),
    defineField({ name: 'alt', title: 'Alt text (describe the picture, for Google & screen readers)', type: 'string' }),
    defineField({ name: 'originalSrc', title: 'Original file', type: 'string', hidden: true }),
    defineField({ name: 'originalAssetId', type: 'string', hidden: true }),
  ],
  preview: {
    select: { media: 'image', alt: 'alt', src: 'originalSrc' },
    prepare: ({ media, alt, src }) => ({ title: alt || src?.split('/').pop() || 'Image', subtitle: 'Image', media }),
  },
});

export const pageSection = defineType({
  name: 'pageSection',
  title: 'Section',
  type: 'object',
  icon: BlockContentIcon,
  fields: [
    defineField({ name: 'title', type: 'string', readOnly: true }),
    defineField({
      name: 'items',
      title: 'Text & images',
      type: 'array',
      of: [defineArrayMember({ type: 'textItem' }), defineArrayMember({ type: 'imageItem' })],
      options: LOCKED,
    }),
  ],
  preview: {
    select: { title: 'title', items: 'items' },
    prepare: ({ title, items }) => {
      const list = (items ?? []) as { _type: string }[];
      const imgs = list.filter((i) => i._type === 'imageItem').length;
      return { title, subtitle: `${list.length - imgs} text · ${imgs} image${imgs === 1 ? '' : 's'}` };
    },
  },
});

/** The "Page content" field used by pages and landing pages. */
export const sectionsField = (group?: string) =>
  defineField({
    name: 'sections',
    title: 'Page content',
    description: 'Open a section to edit its text and pictures. The layout and design stay as they are.',
    type: 'array',
    group,
    of: [defineArrayMember({ type: 'pageSection' })],
    options: LOCKED,
  });

/** An HTML field the site needs but editors never see. */
export const hiddenCode = (name: string, title: string) =>
  defineField({ name, title, type: 'code', hidden: true, options: { language: 'html' } });

/** The layout the sections are filled into (elements with data-cms="…"). */
export const templateField = () => hiddenCode('templateHtml', 'Layout (HTML)');
