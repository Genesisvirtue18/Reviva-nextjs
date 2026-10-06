'use client';

import { Children, cloneElement, isValidElement, useState, useSyncExternalStore, type ReactElement, type ReactNode } from 'react';

/* /blogs: the first 12 posts, then "Load more articles" reveals 12 at a
   time. Every card is in the HTML (crawlers and visitors without
   JavaScript see them all); the extra ones are hidden once the page runs. */

const BATCH = 12;
const noop = () => () => {};

export function LoadMore({ children }: { children: ReactNode }) {
  const cards = Children.toArray(children).filter(isValidElement) as ReactElement<{ hidden?: boolean }>[];
  // false while rendering on the server / hydrating, true once in the browser.
  const inBrowser = useSyncExternalStore(noop, () => true, () => false);
  const [more, setMore] = useState(0);
  const visible = inBrowser ? Math.min(cards.length, BATCH + more) : cards.length;
  const left = cards.length - visible;
  return (
    <>
      <div className="blog-grid">{cards.map((c, i) => cloneElement(c, { hidden: i >= visible || undefined }))}</div>
      <div className="blog-more">
        <button type="button" className="blog-more__btn" id="loadMore" hidden={!inBrowser || left <= 0} onClick={() => setMore(more + BATCH)}>
          Load more articles <span className="blog-more__count">({left} more)</span>
        </button>
      </div>
    </>
  );
}
