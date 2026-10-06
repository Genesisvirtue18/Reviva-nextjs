import { defineField, defineType } from 'sanity';
import { RocketIcon } from '@sanity/icons/Rocket';
import { hiddenCode, sectionsField, templateField } from './pageFields';

/* The ad landing pages under /lp/. Each is a complete standalone HTML
   document (its own <head>, no site header/footer), edited like a page:
   text and pictures in "Page content", the full HTML layout under Advanced. */
export const landingPage = defineType({
  name: 'landingPage',
  title: 'Landing page',
  type: 'document',
  icon: RocketIcon,
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Page address',
      type: 'slug',
      description: 'The page is served at /lp/<this value>.',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    sectionsField(),
    templateField(),
    hiddenCode('html', 'Full page HTML'),
  ],
  preview: { select: { title: 'title', slug: 'slug.current' }, prepare: ({ title, slug }) => ({ title, subtitle: `/lp/${slug ?? ''}` }) },
});
