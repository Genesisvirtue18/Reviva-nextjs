import { defineArrayMember, defineField, defineType } from 'sanity';
import { DocumentIcon } from '@sanity/icons/Document';
import { PAGE_BLOCKS } from './blocks';

/* A website page, built from sections (components/blocks). Editors change
   the sections' texts and pictures, add / reorder / remove sections. */

const hidden = (name: string, type = 'text') => defineField({ name, type, hidden: true });

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: DocumentIcon,
  groups: [
    { name: 'content', title: 'Sections', default: true },
    { name: 'seo', title: 'Google (SEO)' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Page name',
      type: 'string',
      group: 'content',
      description: 'Short name used in this Studio, e.g. "Tattoo Removal". Not shown on the website.',
    }),
    defineField({
      name: 'blocks',
      title: 'Sections',
      description: 'The page from top to bottom. Open a section to edit it; drag to reorder; use "Add item" for a new section.',
      type: 'array',
      group: 'content',
      of: PAGE_BLOCKS.map((t) => defineArrayMember({ type: t })),
    }),
    defineField({ name: 'title', title: 'Page title (browser tab / Google)', type: 'string', group: 'seo', validation: (r) => r.required() }),
    defineField({ name: 'metaDescription', title: 'Google description', type: 'text', rows: 3, group: 'seo' }),
    defineField({
      name: 'path',
      title: 'Page address (URL)',
      type: 'string',
      group: 'seo',
      description: 'e.g. /acne. Changing this changes the live web address - add a Redirect from the old one.',
      validation: (r) => r.required().custom((v) => (!v || v.startsWith('/') ? true : 'Must start with /')),
    }),

    // Technical parts of the page (tracking / head tags / page scripts). The
    // site uses them; editors never need to see them.
    defineField({ name: 'whatsapp', type: 'boolean', hidden: true, initialValue: true }),
    hidden('scriptsHtml'),
    hidden('headHtml'),
    hidden('bodyStartHtml'),
    hidden('bodyEndHtml'),
    hidden('bodyClass', 'string'),
  ],
  preview: {
    select: { name: 'name', title: 'title', path: 'path' },
    prepare: ({ name, title, path }) => ({ title: name || title, subtitle: path === '/' ? 'Home page' : path?.replace(/^\//, '') }),
  },
});
