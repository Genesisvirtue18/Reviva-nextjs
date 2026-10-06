import { createClient } from 'next-sanity';

import { apiVersion, dataset, projectId } from './sanity-env';

export { apiVersion, dataset, projectId };

/** False until the Sanity env vars are set - the site then serves content/*.json. */
export const sanityEnabled = Boolean(projectId);

/* Read client. The token lets the site read a private dataset (keep it
   private: enquiries hold patients' names and phone numbers). With a token
   the API would also return drafts, so the site asks for published content
   only - unfinished edits never reach the website before "Publish". */
export const client = sanityEnabled
  ? createClient({ projectId, dataset, apiVersion, useCdn: false, perspective: 'published', token: process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN })
  : null;

/** Write client for the contact form and import script (server-only token). */
export const writeClient =
  sanityEnabled && process.env.SANITY_API_WRITE_TOKEN
    ? createClient({ projectId, dataset, apiVersion, useCdn: false, token: process.env.SANITY_API_WRITE_TOKEN })
    : null;
