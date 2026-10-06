import { createClient } from 'next-sanity';

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '';
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
export const apiVersion = '2025-01-01';

/** False until the Sanity env vars are set - the site then serves content/*.json. */
export const sanityEnabled = Boolean(projectId);

export const client = sanityEnabled
  ? createClient({ projectId, dataset, apiVersion, useCdn: false })
  : null;

/** Write client for the contact form and import script (server-only token). */
export const writeClient =
  sanityEnabled && process.env.SANITY_API_WRITE_TOKEN
    ? createClient({ projectId, dataset, apiVersion, useCdn: false, token: process.env.SANITY_API_WRITE_TOKEN })
    : null;
