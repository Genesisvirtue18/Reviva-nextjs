import { defineField, defineType } from 'sanity';
import { EnvelopeIcon } from '@sanity/icons/Envelope';

export const STATUSES = ['new', 'contacted', 'booked', 'closed'] as const;
export type Status = (typeof STATUSES)[number];

/* Leads posted to /contact-process.php (replaces the old MySQL enquiries table).
   Worked from the "Enquiries" dashboard tool or the status lists. */
export const enquiry = defineType({
  name: 'enquiry',
  title: 'Enquiry',
  type: 'document',
  icon: EnvelopeIcon,
  groups: [
    { name: 'lead', title: 'Lead', default: true },
    { name: 'tracking', title: 'Tracking' },
  ],
  fields: [
    defineField({
      name: 'status',
      type: 'string',
      group: 'lead',
      options: { list: STATUSES.map((s) => ({ title: s[0].toUpperCase() + s.slice(1), value: s })), layout: 'radio', direction: 'horizontal' },
      initialValue: 'new',
    }),
    defineField({ name: 'name', type: 'string', group: 'lead' }),
    defineField({ name: 'phone', type: 'string', group: 'lead' }),
    defineField({ name: 'email', type: 'string', group: 'lead' }),
    defineField({ name: 'concern', type: 'string', group: 'lead' }),
    defineField({ name: 'message', type: 'text', group: 'lead' }),
    defineField({ name: 'followUpOn', title: 'Follow up on', type: 'date', group: 'lead' }),
    defineField({
      name: 'notes',
      title: 'Internal notes',
      type: 'text',
      rows: 4,
      group: 'lead',
      description: 'Call outcome, appointment details… Never shown on the website.',
    }),
    defineField({ name: 'submittedAt', type: 'datetime', readOnly: true, group: 'lead' }),
    defineField({ name: 'sourcePage', title: 'Source page', type: 'string', readOnly: true, group: 'tracking' }),
    defineField({
      name: 'tracking',
      type: 'object',
      readOnly: true,
      group: 'tracking',
      fields: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'referrer', 'landing_page'].map(
        (n) => defineField({ name: n, type: 'string' }),
      ),
    }),
  ],
  orderings: [{ title: 'Newest', name: 'newest', by: [{ field: 'submittedAt', direction: 'desc' }] }],
  preview: {
    select: { name: 'name', phone: 'phone', status: 'status', concern: 'concern', at: 'submittedAt' },
    prepare: ({ name, phone, status, concern, at }) => ({
      title: `${status === 'new' || !status ? '● ' : ''}${name ?? '(no name)'}`,
      subtitle: [phone, concern, at && new Date(at).toLocaleDateString('en-IN')].filter(Boolean).join(' · '),
    }),
  },
});
