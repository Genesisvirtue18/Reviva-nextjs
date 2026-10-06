import { defineField, defineType } from 'sanity';
import { EnvelopeIcon } from '@sanity/icons/Envelope';

/* Leads posted to /contact-process.php (replaces the old MySQL enquiries table). */
export const enquiry = defineType({
  name: 'enquiry',
  title: 'Enquiry',
  type: 'document',
  icon: EnvelopeIcon,
  fields: [
    defineField({ name: 'name', type: 'string' }),
    defineField({ name: 'phone', type: 'string' }),
    defineField({ name: 'email', type: 'string' }),
    defineField({ name: 'concern', type: 'string' }),
    defineField({ name: 'message', type: 'text' }),
    defineField({
      name: 'status',
      type: 'string',
      options: { list: ['new', 'contacted', 'booked', 'closed'], layout: 'radio' },
      initialValue: 'new',
    }),
    defineField({ name: 'sourcePage', title: 'Source page', type: 'string', readOnly: true }),
    defineField({
      name: 'tracking',
      type: 'object',
      readOnly: true,
      options: { collapsed: true },
      fields: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'referrer', 'landing_page'].map(
        (n) => defineField({ name: n, type: 'string' }),
      ),
    }),
    defineField({ name: 'submittedAt', type: 'datetime', readOnly: true }),
  ],
  orderings: [{ title: 'Newest', name: 'newest', by: [{ field: 'submittedAt', direction: 'desc' }] }],
  preview: { select: { title: 'name', subtitle: 'phone', status: 'status' } },
});
