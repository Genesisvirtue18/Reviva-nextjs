import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { parseBody } from 'next-sanity/webhook';

/* Sanity webhook target: refreshes the site as soon as an editor publishes.
   Set up in sanity.io/manage → API → Webhooks, pointing at
   https://<your-domain>/api/revalidate with the SANITY_REVALIDATE_SECRET. */
export async function POST(req: NextRequest) {
  const { isValidSignature } = await parseBody(req, process.env.SANITY_REVALIDATE_SECRET);
  if (!isValidSignature) return new NextResponse('Invalid signature', { status: 401 });
  revalidateTag('sanity', { expire: 0 });
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
