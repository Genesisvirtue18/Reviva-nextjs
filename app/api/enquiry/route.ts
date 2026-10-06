import { NextResponse, type NextRequest } from 'next/server';
import { writeClient } from '@/lib/sanity';

/* POST /api/enquiry: validates a lead from the contact form, stores it as an
   "enquiry" in Sanity (Studio → Enquiries) and, when configured, emails it
   via Resend. Answers JSON for the form script; a plain form post (no
   JavaScript) is redirected back to /contact?sent=1. */

const TRACKING = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'referrer', 'landing_page'] as const;

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/contact', req.url), 303);
}

export async function POST(req: NextRequest) {
  const wantsJson =
    (req.headers.get('accept') ?? '').includes('application/json') ||
    (req.headers.get('x-requested-with') ?? '').toLowerCase() === 'xmlhttprequest';

  const respond = (ok: boolean, message: string) =>
    wantsJson
      ? NextResponse.json({ ok, message }, { status: ok ? 200 : 422 })
      : ok
        ? NextResponse.redirect(new URL('/contact?sent=1', req.url), 303)
        : new NextResponse(message, { status: 422 });

  const form = await req.formData();
  const field = (k: string, max = 500) => String(form.get(k) ?? '').trim().slice(0, max);

  // Honeypot: bots fill every field; answer as if it worked and store nothing.
  if (field('website')) return respond(true, 'Thank you.');

  const name = field('full_name', 120) || field('name', 120);
  let phone = field('phone').replace(/\D/g, '');
  if (phone.length > 10) phone = phone.slice(-10); // strip leading 91 / 0

  const errors: string[] = [];
  if (name.length < 2) errors.push('Please enter your name.');
  if (!/^[6-9]\d{9}$/.test(phone)) errors.push('Please enter a valid 10-digit mobile number.');
  if (errors.length) return respond(false, errors.join(' '));

  const doc = {
    _type: 'enquiry',
    name,
    phone,
    email: field('email', 190) || undefined,
    concern: field('concern', 190) || undefined,
    message: field('message', 4000) || undefined,
    status: 'new',
    sourcePage: field('source_page') || req.headers.get('referer') || undefined,
    tracking: Object.fromEntries(TRACKING.map((k) => [k, field(k) || undefined])),
    submittedAt: new Date().toISOString(),
  };

  // A lead must not be lost quietly: fail loudly if it can't be stored.
  if (!writeClient) return respond(false, 'Enquiries are not configured yet. Please call us instead.');
  try {
    await writeClient.create(doc);
  } catch (e) {
    console.error('Enquiry save failed', e);
    return respond(false, 'Something went wrong saving your request. Please call us instead.');
  }

  const to = process.env.LEAD_EMAIL;
  if (to && process.env.RESEND_API_KEY) {
    const body = [
      'New enquiry from the website',
      '',
      `Name    : ${name}`,
      `Phone   : ${phone}`,
      doc.email ? `Email   : ${doc.email}` : '',
      doc.concern ? `Concern : ${doc.concern}` : '',
      `Page    : ${doc.sourcePage ?? ''}`,
      '',
      'Message:',
      doc.message ?? '(none)',
    ].filter((l) => l !== null).join('\n');
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.LEAD_EMAIL_FROM || 'Reviva Website <onboarding@resend.dev>',
        to: to.split(',').map((s) => s.trim()),
        subject: `New enquiry: ${name} (${phone})`,
        text: body,
      }),
    }).catch((e) => console.error('Enquiry email failed', e));
  }

  return respond(true, 'Thank you! We will call you shortly.');
}
