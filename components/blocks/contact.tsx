import { Lines } from '@/lib/rich';

/* Contact page: the enquiry form (sent to /api/enquiry by the site script,
   saved in Studio → Enquiries), the clinic details and the maps. */

export type ContactSectionBlock = {
  _type: 'contactSection';
  _key: string;
  formTitle?: string;
  labels?: { name?: string; phone?: string; email?: string; concern?: string; message?: string };
  concerns?: string[];
  buttonLabel?: string;
  infoTitle?: string;
  details?: { _key: string; icon?: string; color?: 'gold' | 'green'; label?: string; value?: string; href?: string; note?: string }[];
  maps?: { _key: string; title?: string; embedUrl?: string }[];
};

export function ContactSection({ b }: { b: ContactSectionBlock }) {
  const l = b.labels ?? {};
  return (
    <section className="contact-section">
      <div className="contact-container">
        <div className="contact-form-wrapper">
          <h2>{b.formTitle}</h2>
          <form className="contact-form" action="/api/enquiry" method="POST">
            <div className="form-group full">
              <label>{l.name}</label>
              <input type="text" name="full_name" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{l.phone}</label>
                <input type="text" name="phone" required />
              </div>
              <div className="form-group">
                <label>{l.email}</label>
                <input type="email" name="email" required />
              </div>
            </div>
            <div className="form-group full">
              <label>{l.concern}</label>
              <select name="concern">
                {(b.concerns ?? []).map((c) => (
                  <option value={c} key={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group full">
              <label>{l.message}</label>
              <textarea rows={5} name="message" required></textarea>
            </div>
            <button type="submit" className="submit-btn">
              {b.buttonLabel}
            </button>
          </form>
        </div>
        <div className="contact-info">
          <h2>{b.infoTitle}</h2>
          {(b.details ?? []).map((d) => (
            <div className="info-box" key={d._key}>
              <div className={`icon ${d.color ?? 'gold'}`}>{d.icon}</div>
              <div>
                <span>{d.label}</span>
                {d.href ? (
                  <a href={d.href}>{d.value}</a>
                ) : (
                  <p>
                    <Lines text={d.value} />
                  </p>
                )}
                {d.note ? (
                  <small>
                    <Lines text={d.note} />
                  </small>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="map-grid">
        {(b.maps ?? []).map((m) => (
          <div className="map-box" key={m._key}>
            <iframe title={m.title} src={m.embedUrl} width="600" height="450" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin"></iframe>
          </div>
        ))}
      </div>
    </section>
  );
}
