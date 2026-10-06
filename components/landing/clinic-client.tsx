'use client';

import { useState, type FormEvent, type ReactNode } from 'react';

/* Interactive parts of the "clinic" landing page. */

/** FAQ: one answer open at a time (the first starts open). */
export function ClinicFaqList({ items }: { items: { key: string; question: string; answer: ReactNode }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      {items.map((it, i) => (
        <div className={open === i ? 'faq-item open' : 'faq-item'} key={it.key}>
          <div className="faq-q" onClick={() => setOpen(open === i ? null : i)}>
            {it.question} <span className="arrow">▼</span>
          </div>
          <div className="faq-a">
            <div className="faq-a-inner">{it.answer}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const TRACKING = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'];

/** Booking form: sends the lead to /api/enquiry (Studio → Enquiries). */
export function ClinicBookingForm(p: { namePlaceholder: string; phonePlaceholder: string; concernPlaceholder: string; concerns: string[]; buttonLabel: string }) {
  const [sending, setSending] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    data.set('source_page', window.location.pathname);
    data.set('landing_page', window.location.pathname + window.location.search);
    const qs = new URLSearchParams(window.location.search);
    TRACKING.forEach((k) => qs.get(k) && data.set(k, qs.get(k)!));
    if (document.referrer) data.set('referrer', document.referrer);
    setSending(true);
    try {
      const res = await fetch('/api/enquiry', { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      const r = await res.json().catch(() => ({ ok: res.ok, message: '' }));
      if (r.ok) {
        window.alert('Booked! Our team will call you within 30 minutes to confirm your free consultation.');
        form.reset();
      } else window.alert(r.message || 'Something went wrong. Please call us instead.');
    } catch {
      window.alert('Could not send your request. Please check your connection or call us.');
    } finally {
      setSending(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', boxShadow: 'var(--shadow)', marginBottom: '28px' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div className="form-group">
          <input type="text" name="full_name" placeholder={p.namePlaceholder} required />
        </div>
        <div className="form-group">
          <input type="tel" name="phone" placeholder={p.phonePlaceholder} required />
        </div>
      </div>
      <div className="form-group">
        <select
          name="concern"
          defaultValue=""
          style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '10px 14px', fontFamily: "'DM Sans',sans-serif", fontSize: '14px', color: 'var(--text)', background: 'var(--off-white)' }}
        >
          <option value="">{p.concernPlaceholder}</option>
          {p.concerns.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="form-submit" disabled={sending}>
        {p.buttonLabel}
      </button>
    </form>
  );
}
