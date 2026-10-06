'use client';

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { codeInput } from '@sanity/code-input';
import { schemaTypes } from './sanity/schemaTypes';
import { structure } from './sanity/structure';
import { apiVersion, dataset, projectId } from './lib/sanity';

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
  plugins: [structureTool({ structure }), codeInput(), visionTool({ defaultApiVersion: apiVersion })],
});
