'use client';

import { useEffect } from 'react';

/* Loads the site script (header menu, scroll effects, FAQ, contact form)
   only after React has hydrated the page. Loaded earlier, it changed the
   server-rendered markup first (header "is-scrolled", fade-in classes,
   WhatsApp pulse) and React reported a hydration mismatch. */
export function SiteScript({ src }: { src: string }) {
  useEffect(() => {
    if (document.querySelector(`script[data-site-script]`)) return;
    const s = document.createElement('script');
    s.src = src;
    s.dataset.siteScript = '';
    document.body.appendChild(s);
  }, [src]);
  return null;
}
