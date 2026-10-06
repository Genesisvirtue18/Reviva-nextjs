'use client';

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { codeInput } from '@sanity/code-input';
import { schemaTypes } from './sanity/schemaTypes';
import { structure } from './sanity/structure';
import { EnquiriesTool } from './sanity/tools/EnquiriesTool';
import { EnvelopeIcon } from '@sanity/icons/Envelope';
import { dataset, projectId } from './lib/sanity-env';

export default defineConfig({
  name: 'reviva',
  title: 'Reviva Skin & Surgery',
  basePath: '/studio',
  projectId,
  dataset,
  schema: {
    types: schemaTypes,
    // Site Settings is a singleton: no "create new" / duplicate / delete.
    templates: (templates) => templates.filter(({ schemaType }) => schemaType !== 'siteSettings'),
  },
  document: {
    actions: (actions, { schemaType }) =>
      schemaType === 'siteSettings' ? actions.filter(({ action }) => !['duplicate', 'delete', 'unpublish'].includes(action ?? '')) : actions,
  },
  // codeInput only provides the (hidden) HTML field type - editors never see code.
  plugins: [structureTool({ structure }), codeInput()],
  // Enquiries dashboard in the top bar, right after the content editor.
  tools: (prev) => [prev[0], { name: 'enquiries', title: 'Enquiries', icon: EnvelopeIcon, component: EnquiriesTool }, ...prev.slice(1)],
});
