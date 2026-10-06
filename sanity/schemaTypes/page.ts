import { defineField, defineType } from 'sanity';
import { DocumentIcon } from '@sanity/icons/Document';

/* One document per URL of the old static site. The page body is stored as the
   original HTML so the design stays pixel-identical; edit text, images and
   links directly in the "Page content" HTML. */
export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: DocumentIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
    { name: 'advanced', title: 'Advanced' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Page title (browser tab / Google)',
      type: 'string',
      group: ['content', 'seo'],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'path',
      title: 'URL path',
      type: 'string',
      description: 'e.g. /acne.html or /blog/my-post.html. Changing this changes the live URL.',
      group: 'content',
      validation: (r) =>
        r.required().custom((v) => (!v || v.startsWith('/') ? true : 'Must start with /')),
    }),
    defineField({
      name: 'pageType',
      title: 'Type',
      type: 'string',
      group: 'content',
      options: { list: [{ title: 'Page', value: 'page' }, { title: 'Blog post', value: 'blog' }], layout: 'radio' },
      initialValue: 'page',
    }),
    defineField({
      name: 'contentHtml',
      title: 'Page content (HTML)',
      type: 'code',
      group: 'content',
      description: 'Everything between the site header and footer.',
      options: { language: 'html', languageAlternatives: [{ title: 'HTML', value: 'html' }] },
    }),
    defineField({ name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3, group: 'seo' }),
    defineField({
      name: 'headHtml',
      title: 'Head tags (HTML)',
      type: 'code',
      group: ['seo', 'advanced'],
      description: 'Canonical, Open Graph, schema JSON-LD, stylesheets and tracking for this page.',
      options: { language: 'html' },
    }),
    defineField({ name: 'bodyClass', title: 'Body CSS class', type: 'string', group: 'advanced' }),
    defineField({ name: 'bodyStartHtml', title: 'Start of <body> (HTML)', type: 'code', group: 'advanced', options: { language: 'html' } }),
    defineField({ name: 'bodyEndHtml', title: 'End of <body> (HTML)', type: 'code', group: 'advanced', options: { language: 'html' } }),
  ],
  preview: { select: { title: 'title', subtitle: 'path' } },
  orderings: [{ title: 'URL', name: 'pathAsc', by: [{ field: 'path', direction: 'asc' }] }],
});
