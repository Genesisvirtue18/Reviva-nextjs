import { defineField, defineType } from 'sanity';
import { ArrowRightIcon } from '@sanity/icons/ArrowRight';

/* 301 redirects. Read when the site is built, so changes go live on the next
   deploy (or the publish webhook's deploy hook). */
export const redirect = defineType({
  name: 'redirect',
  title: 'Redirect',
  type: 'document',
  icon: ArrowRightIcon,
  fields: [
    defineField({
      name: 'source',
      title: 'From (old URL path)',
      type: 'string',
      validation: (r) => r.required().custom((v) => (!v || v.startsWith('/') ? true : 'Must start with /')),
    }),
    defineField({
      name: 'destination',
      title: 'To (new URL path or full URL)',
      type: 'string',
      validation: (r) => r.required(),
    }),
  ],
  preview: { select: { title: 'source', subtitle: 'destination' } },
  orderings: [{ title: 'From', name: 'sourceAsc', by: [{ field: 'source', direction: 'asc' }] }],
});
