'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/* Results galleries: category pills (current page highlighted, one
   swipeable row on phones) and an even photo grid that opens each photo
   full-screen (arrows, swipe, Esc). Styles: public/assets/css/gallery.css. */

type Link = { key: string; label: string; href: string };
type Photo = { key: string; src: string; alt: string };

const clean = (p: string) => p.replace(/\/+$/, '') || '/';

export function GalleryFilterBar({ links }: { links: Link[] }) {
  const path = clean(usePathname() ?? '/');
  const row = useRef<HTMLDivElement>(null);
  // Keep the current category in view on phones.
  useEffect(() => {
    row.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [path]);
  return (
    <nav className="rv-filters" aria-label="Result categories">
      <div className="rv-filters__row" ref={row}>
        {links.map((l) => (
          <a key={l.key} href={l.href} className="rv-filters__pill" aria-current={clean(l.href) === path ? 'page' : undefined}>
            {l.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function GalleryPhotos({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const touch = useRef<number | null>(null);
  const go = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, go]);

  return (
    <section className="rv-gallery">
      <p className="rv-gallery__count">
        {photos.length} {photos.length === 1 ? 'transformation' : 'transformations'} · tap a photo to enlarge
      </p>
      <ul className="rv-gallery__grid">
        {photos.map((p, i) => (
          <li key={p.key}>
            <button type="button" className="rv-gallery__card" onClick={() => setOpen(i)} aria-label={`Enlarge result ${i + 1} of ${photos.length}`}>
              <img src={p.src} alt={p.alt || `Before and after result ${i + 1}`} loading={i < 6 ? 'eager' : 'lazy'} decoding="async" />
            </button>
          </li>
        ))}
      </ul>

      {open !== null ? (
        <div
          className="rv-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Result ${open + 1} of ${photos.length}`}
          onClick={(e) => e.target === e.currentTarget && setOpen(null)}
          onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touch.current === null) return;
            const dx = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touch.current = null;
          }}
        >
          <button type="button" className="rv-lightbox__close" onClick={() => setOpen(null)} aria-label="Close">
            ×
          </button>
          {photos.length > 1 ? (
            <button type="button" className="rv-lightbox__nav rv-lightbox__nav--prev" onClick={() => go(-1)} aria-label="Previous result">
              ‹
            </button>
          ) : null}
          <img className="rv-lightbox__img" src={photos[open].src} alt={photos[open].alt || `Before and after result ${open + 1}`} />
          {photos.length > 1 ? (
            <button type="button" className="rv-lightbox__nav rv-lightbox__nav--next" onClick={() => go(1)} aria-label="Next result">
              ›
            </button>
          ) : null}
          <p className="rv-lightbox__count">
            {open + 1} / {photos.length}
          </p>
        </div>
      ) : null}
    </section>
  );
}
