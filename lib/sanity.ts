import { createClient } from 'next-sanity';

import { apiVersion, dataset, projectId } from './sanity-env';

export { apiVersion, dataset, projectId };

/** Sanity is the only content source: without it the site cannot be built. */
export const sanityEnabled = Boolean(projectId);
if (!sanityEnabled) {
  throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is not set - all site content comes from Sanity. Add the Sanity environment variables (see .env.example).');
}

/* Read client. The token lets the site read a private dataset (keep it
   private: enquiries hold patients' names and phone numbers). With a token
   the API would also return drafts, so the site asks for published content
   only - unfinished edits never reach the website before "Publish". */
export const client = createClient({ projectId, dataset, apiVersion, useCdn: false, perspective: 'published', token: process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN });

/** Write client for the contact form and import script (server-only token). */
export const writeClient =
  process.env.SANITY_API_WRITE_TOKEN
    ? createClient({ projectId, dataset, apiVersion, useCdn: false, token: process.env.SANITY_API_WRITE_TOKEN })
    : null;
