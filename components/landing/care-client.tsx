'use client';

import { useState } from 'react';
import Script from 'next/script';

/* The "care" landing page's before / after carousel (jQuery + Owl Carousel,
   as on the original page): load jQuery, then Owl, then start it. */

declare global {
  interface Window {
    jQuery?: ((sel: string) => { owlCarousel: (o: object) => void }) & object;
  }
}

export function CareCarousel() {
  const [jquery, setJquery] = useState(false);
  const start = () => {
    if (window.jQuery && document.getElementById('beforeAfterCarousel')) {
      window.jQuery('#beforeAfterCarousel').owlCarousel({
        loop: true,
        margin: 14,
        nav: false,
        dots: true,
        autoplay: true,
        autoplayTimeout: 2800,
        autoplayHoverPause: true,
        responsive: { 0: { items: 1 }, 768: { items: 2 }, 1200: { items: 3 } },
      });
    }
  };
  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js" strategy="afterInteractive" onReady={() => setJquery(true)} />
      {jquery ? <Script src="https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/owl.carousel.min.js" strategy="afterInteractive" onReady={start} /> : null}
    </>
  );
}
