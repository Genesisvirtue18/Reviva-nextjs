import { defineArrayMember, defineField, defineType } from 'sanity';
import { CogIcon } from '@sanity/icons/Cog';

const link = defineArrayMember({
  type: 'object',
  name: 'link',
  fields: [
    defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'href', title: 'URL', type: 'string', validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'label', subtitle: 'href' } },
});

/* Header + footer content shared by every page. Leave a field empty to keep
   the original site's value. */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'header', title: 'Header', default: true },
    { name: 'footer', title: 'Footer' },
  ],
  fields: [
    defineField({ name: 'logo', title: 'Logo image path', type: 'string', group: ['header', 'footer'] }),
    defineField({ name: 'logoAlt', title: 'Logo alt text', type: 'string', group: ['header', 'footer'] }),
    defineField({ name: 'callDisplay', title: 'Header phone (shown)', type: 'string', group: 'header' }),
    defineField({ name: 'callTel', title: 'Header phone (dialled, e.g. +917827448711)', type: 'string', group: 'header' }),
    defineField({ name: 'bookUrl', title: '"Book Now" link', type: 'string', group: 'header' }),
    defineField({
      name: 'nav',
      title: 'Main menu',
      type: 'array',
      group: 'header',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'navItem',
          fields: [
            defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'href', title: 'URL (leave empty for a dropdown)', type: 'string' }),
            defineField({
              name: 'columns',
              title: 'Dropdown columns',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'navColumn',
                  fields: [
                    defineField({ name: 'title', type: 'string' }),
                    defineField({ name: 'description', type: 'string' }),
                    defineField({ name: 'feature', title: 'Highlighted column', type: 'boolean' }),
                    defineField({ name: 'links', type: 'array', of: [link] }),
                  ],
                }),
              ],
            }),
          ],
          preview: { select: { title: 'label', subtitle: 'href' } },
        }),
      ],
    }),
    defineField({ name: 'footerBlurb', title: 'Footer text', type: 'text', rows: 3, group: 'footer' }),
    defineField({
      name: 'social',
      title: 'Social links',
      type: 'object',
      group: 'footer',
      fields: ['facebook', 'instagram', 'youtube', 'x'].map((n) => defineField({ name: n, type: 'string' })),
    }),
    defineField({ name: 'footerTreatments', title: 'Footer: Treatments links', type: 'array', of: [link], group: 'footer' }),
    defineField({ name: 'footerClinic', title: 'Footer: Clinic links', type: 'array', of: [link], group: 'footer' }),
    defineField({
      name: 'locations',
      title: 'Clinic locations',
      type: 'array',
      group: 'footer',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'location',
          fields: [
            defineField({ name: 'name', type: 'string' }),
            defineField({ name: 'address', type: 'text', rows: 2 }),
            defineField({ name: 'phoneDisplay', title: 'Phone (shown)', type: 'string' }),
            defineField({ name: 'phoneTel', title: 'Phone (dialled)', type: 'string' }),
          ],
        }),
      ],
    }),
    defineField({ name: 'email', type: 'string', group: 'footer' }),
    defineField({ name: 'hours', title: 'Clinic hours', type: 'string', group: 'footer' }),
    defineField({ name: 'legal', title: 'Footer: legal links', type: 'array', of: [link], group: 'footer' }),
  ],
  preview: { prepare: () => ({ title: 'Site Settings' }) },
});
