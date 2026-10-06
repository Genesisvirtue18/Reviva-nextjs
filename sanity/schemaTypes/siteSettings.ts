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
    { name: 'blog', title: 'Blog' },
    { name: 'seo', title: 'Google & tracking' },
    { name: 'notFound', title: '404 page' },
  ],
  fields: [
    defineField({
      name: 'logoImage',
      title: 'Logo',
      type: 'image',
      group: ['header', 'footer'],
      description: 'Upload a new logo here. Leave empty to keep the current logo.',
    }),
    defineField({ name: 'logo', title: 'Logo image path', type: 'string', hidden: true }),
    defineField({ name: 'logoAlt', title: 'Logo alt text', type: 'string', group: ['header', 'footer'] }),
    defineField({ name: 'callDisplay', title: 'Header phone (shown)', type: 'string', group: 'header' }),
    defineField({ name: 'callTel', title: 'Header phone (dialled, e.g. +917827448711)', type: 'string', group: 'header' }),
    defineField({ name: 'bookUrl', title: '"Book Now" link', type: 'string', group: 'header' }),
    defineField({ name: 'bookLabel', title: '"Book Now" button text', type: 'string', group: 'header' }),
    defineField({ name: 'bookLabelShort', title: '"Book Now" button text on phones', type: 'string', group: 'header' }),
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
    defineField({
      name: 'footerHeadings',
      title: 'Footer column headings',
      type: 'object',
      group: 'footer',
      fields: [
        defineField({ name: 'treatments', title: 'Treatments column', type: 'string' }),
        defineField({ name: 'clinic', title: 'Clinic column', type: 'string' }),
        defineField({ name: 'visit', title: 'Locations column', type: 'string' }),
        defineField({ name: 'hours', title: 'Hours heading', type: 'string' }),
      ],
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
    defineField({
      name: 'copyright',
      title: 'Copyright line',
      type: 'string',
      group: 'footer',
      description: 'Shown after "© <current year>".',
    }),
    defineField({ name: 'clinicName', title: 'Clinic name (Google / social sharing)', type: 'string', group: 'seo' }),
    defineField({ name: 'siteUrl', title: 'Website address', type: 'string', group: 'seo', description: 'e.g. https://revivaskinandsurgery.com - used for Google (canonical links, sitemap).' }),
    defineField({ name: 'shareImage', title: 'Share image (shown when a page is shared on WhatsApp / Facebook)', type: 'picture', group: 'seo' }),
    defineField({ name: 'gaId', title: 'Google Analytics ID', type: 'string', group: 'seo', description: 'e.g. G-NK5136X7JT' }),
    defineField({ name: 'gtmId', title: 'Google Tag Manager ID', type: 'string', group: 'seo', description: 'e.g. GTM-M3DMBLNW' }),
    defineField({ name: 'googleVerification', title: 'Google Search Console verification code', type: 'string', group: 'seo' }),
    defineField({ name: 'whatsappUrl', title: 'WhatsApp link (floating button)', type: 'string', group: 'header', description: 'e.g. https://wa.me/917827448711' }),
    defineField({
      name: 'postCta',
      title: 'Consultation box under every post',
      type: 'object',
      group: 'blog',
      fields: [
        defineField({ name: 'eyebrow', title: 'Small label', type: 'string' }),
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'text', type: 'text', rows: 2 }),
        defineField({ name: 'altText', title: 'Text before the links (e.g. "Prefer to write?")', type: 'string' }),
        defineField({ name: 'whatsappLabel', title: 'WhatsApp link text', type: 'string' }),
        defineField({ name: 'whatsappHref', title: 'WhatsApp link', type: 'string' }),
        defineField({ name: 'bookLabel', title: 'Booking link text', type: 'string' }),
        defineField({ name: 'bookHref', title: 'Booking link', type: 'string' }),
      ],
    }),
    defineField({
      name: 'blogSidebar',
      title: 'Blog sidebar',
      type: 'object',
      group: 'blog',
      fields: [
        defineField({ name: 'treatmentsTitle', title: 'Treatments box title', type: 'string' }),
        defineField({ name: 'treatments', title: 'Treatment links', type: 'array', of: [link] }),
        defineField({ name: 'ctaEyebrow', title: 'Consultation box: small label', type: 'string' }),
        defineField({ name: 'ctaTitle', title: 'Consultation box: title', type: 'string' }),
        defineField({ name: 'ctaText', title: 'Consultation box: text', type: 'text', rows: 2 }),
        defineField({ name: 'ctaButtonLabel', title: 'Consultation box: button text', type: 'string' }),
        defineField({ name: 'ctaButtonHref', title: 'Consultation box: button link', type: 'string' }),
      ],
    }),
    defineField({
      name: 'notFound',
      title: '404 page',
      type: 'object',
      group: 'notFound',
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'buttonLabel', title: 'Button text', type: 'string' }),
        defineField({ name: 'buttonHref', title: 'Button link', type: 'string' }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Site Settings' }) },
});
