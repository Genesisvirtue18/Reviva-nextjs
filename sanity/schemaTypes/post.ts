import { defineField, defineType } from 'sanity';
import { ComposeIcon } from '@sanity/icons/Compose';

/* A blog post, shown at /blog/<address>. The consultation box, previous /
   next links and the sidebar are added automatically (their texts are in
   Site Settings → Blog). */

const hidden = (name: string, type = 'text') => defineField({ name, type, hidden: true });

export const post = defineType({
  name: 'post',
  title: 'Blog post',
  type: 'document',
  icon: ComposeIcon,
  groups: [
    { name: 'content', title: 'Post', default: true },
    { name: 'seo', title: 'Google (SEO)' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', group: 'content', validation: (r) => r.required() }),
    defineField({ name: 'author', title: 'Author', type: 'string', group: 'content', initialValue: 'Reviva' }),
    defineField({ name: 'publishedAt', title: 'Date', type: 'date', group: 'content', options: { dateFormat: 'D MMM YYYY' }, validation: (r) => r.required() }),
    defineField({ name: 'readMinutes', title: 'Reading time (minutes)', type: 'number', group: 'content' }),
    defineField({ name: 'cover', title: 'Cover picture', type: 'picture', group: 'content' }),
    defineField({ name: 'excerpt', title: 'Summary (shown on the blog page)', type: 'text', rows: 3, group: 'content' }),
    defineField({ name: 'body', title: 'Article', type: 'richText', group: 'content' }),
    defineField({ name: 'seoTitle', title: 'Page title (browser tab / Google)', type: 'string', group: 'seo', description: 'Leave empty to use the post title.' }),
    defineField({ name: 'metaDescription', title: 'Google description', type: 'text', rows: 3, group: 'seo' }),
    defineField({
      name: 'slug',
      title: 'Page address',
      type: 'slug',
      group: 'seo',
      description: 'The post is at /blog/<this value>.',
      options: { source: 'title', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    hidden('design', 'string'),
    hidden('headHtml'),
    hidden('bodyStartHtml'),
    hidden('bodyEndHtml'),
    hidden('bodyClass', 'string'),
  ],
  orderings: [{ title: 'Newest first', name: 'newest', by: [{ field: 'publishedAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'title', date: 'publishedAt', media: 'cover.image' },
    prepare: ({ title, date, media }) => ({ title, subtitle: date, media }),
  },
});
