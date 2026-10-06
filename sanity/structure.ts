import { map } from 'rxjs';
import type { ListItemBuilder, StructureBuilder, StructureResolver } from 'sanity/structure';
import { CogIcon } from '@sanity/icons/Cog';
import { HomeIcon } from '@sanity/icons/Home';
import { FolderIcon } from '@sanity/icons/Folder';
import { DocumentIcon } from '@sanity/icons/Document';
import { DocumentsIcon } from '@sanity/icons/Documents';
import { EditIcon } from '@sanity/icons/Edit';
import { STATUSES } from './schemaTypes/enquiry';
import { apiVersion } from '../lib/sanity-env';

/* The Studio menu mirrors the website menu (Site Settings → Main menu):
   Home, About, Treatments → Laser → Tattoo Removal… Blog posts sit under
   "Blog", result galleries under the gallery page, and pages that are in
   no menu under "Footer pages" / "Other pages". It updates live when the
   menu is edited. */

type Link = { label?: string; href?: string };
type NavItem = Link & { columns?: { title?: string; links?: Link[] }[] };
type Data = {
  settings: { nav?: NavItem[]; footerClinic?: Link[]; legal?: Link[]; footerTreatments?: Link[] } | null;
  pages: { _id: string; path?: string }[];
};

const QUERY = `{
  "settings": *[_id == "siteSettings"][0]{ nav, footerClinic, legal, footerTreatments },
  "pages": *[_type == "page" && !(_id in path("drafts.**"))]{ _id, path }
}`;

/** "about", "https://site/about#x", "/about/" -> "/about". */
const toPath = (href?: string) => {
  if (!href || /^(#|tel:|mailto:|https?:\/\/(?!(www\.)?revivaskinandsurgery\.com))/i.test(href)) return null;
  let p = href.replace(/^https?:\/\/[^/]+/i, '').split('#')[0].split('?')[0];
  if (!p.startsWith('/')) p = `/${p}`;
  return p.replace(/\/+$/, '') || '/';
};

/** Structure ids may only hold letters, digits, - and _ ("Medi Facials" -> "medi-facials"). */
const sid = (...parts: (string | undefined)[]) =>
  parts.map((x) => (x ?? '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')).join('-') || 'item';

/** Drops missing links and repeats of the same page (ids must be unique in a list). */
const uniq = (items: (ListItemBuilder | null)[]) => {
  const seen = new Set<string>();
  return items.filter((it): it is ListItemBuilder => {
    const id = it?.getId();
    if (!it || !id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const isGallery = (p: string) => /gallery/i.test(p) && p !== '/gallery';

function build(S: StructureBuilder, { settings, pages }: Data) {
  const idByPath = new Map(pages.filter((p) => p.path).map((p) => [p.path!, p._id]));
  const used = new Set<string>();

  const pageItem = (label: string, href?: string, icon = DocumentIcon): ListItemBuilder | null => {
    const path = toPath(href);
    const id = path && idByPath.get(path);
    if (!id) return null;
    used.add(path);
    return S.listItem().id(sid('p', id)).title(label).icon(path === '/' ? HomeIcon : icon).child(S.document().schemaType('page').documentId(id).title(label));
  };

  const docList = (title: string, filter: string, params: Record<string, unknown> = {}) =>
    S.documentList().title(title).schemaType('page').filter(filter).params(params).defaultOrdering([{ field: 'path', direction: 'asc' }]);

  // A menu link whose page has related documents: the page itself + the list.
  const withChildren = (label: string, href: string, childTitle: string, list: ReturnType<typeof docList>) => {
    const self = pageItem(`${label} page`, href);
    return S.listItem()
      .id(sid('g', label))
      .title(label)
      .icon(FolderIcon)
      .child(S.list().title(label).items([...(self ? [self] : []), S.listItem().id(sid('l', label)).title(childTitle).icon(DocumentsIcon).child(list)]));
  };
  const posts = S.documentTypeList('post').title('Blog posts').defaultOrdering([{ field: 'publishedAt', direction: 'desc' }]);

  const menu: ListItemBuilder[] = [];
  for (const item of settings?.nav ?? []) {
    const label = item.label ?? 'Untitled';
    if (item.columns?.length) {
      menu.push(
        S.listItem()
          .id(sid('m', label))
          .title(label)
          .icon(FolderIcon)
          .child(
            S.list()
              .title(label)
              .items(
                item.columns.map((col) =>
                  S.listItem()
                    .id(sid('c', label, col.title))
                    .title(col.title ?? 'Untitled')
                    .icon(FolderIcon)
                    .child(
                      S.list()
                        .title(col.title ?? '')
                        .items(uniq((col.links ?? []).map((l) => pageItem(l.label ?? '', l.href)))),
                    ),
                ),
              ),
          ),
      );
      continue;
    }
    const path = toPath(item.href);
    if (path === '/blogs' || /^blog/i.test(label)) {
      used.add(path ?? '');
      menu.push(withChildren(label, item.href!, 'Blog posts', posts));
    } else if (path === '/gallery') {
      used.add(path);
      menu.push(withChildren(label, item.href!, 'Treatment galleries', docList('Treatment galleries', '_type == "page" && path match "*gallery*" && path != "/gallery"')));
    } else {
      const it = pageItem(label, item.href);
      if (it) menu.push(it);
    }
  }
  pages.forEach((p) => p.path && isGallery(p.path) && used.add(p.path));

  // Footer links not already in the main menu.
  const footer = [...(settings?.footerClinic ?? []), ...(settings?.legal ?? [])]
    .filter((l) => {
      const p = toPath(l.href);
      return p && !used.has(p);
    })
    .map((l) => pageItem(l.label ?? '', l.href));
  const footerItems = uniq(footer);

  return S.list()
    .title('Reviva')
    .items([
      S.listItem().title('Site Settings (header, footer, menu)').id('siteSettings').icon(CogIcon).child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.divider(),
      ...uniq(menu),
      S.divider(),
      ...(footerItems.length ? [S.listItem().id('footer').title('Footer pages').icon(FolderIcon).child(S.list().title('Footer pages').items(footerItems))] : []),
      S.listItem()
        .id('other')
        .title('Other pages')
        .icon(FolderIcon)
        .child(docList('Other pages', '_type == "page" && !(path in $used)', { used: [...used] })),
      S.documentTypeListItem('landingPage').title('Ad landing pages'),
      S.divider(),
      S.listItem()
        .title('Enquiries')
        .schemaType('enquiry')
        .child(
          S.list()
            .title('Enquiries')
            .items([
              ...STATUSES.map((st) =>
                S.listItem()
                  .title(st[0].toUpperCase() + st.slice(1))
                  .schemaType('enquiry')
                  .child(
                    S.documentList()
                      .title(st[0].toUpperCase() + st.slice(1))
                      .filter(st === 'new' ? '_type == "enquiry" && (status == "new" || !defined(status))' : '_type == "enquiry" && status == $st')
                      .params({ st })
                      .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                  ),
              ),
              S.divider(),
              S.listItem()
                .title('All enquiries')
                .schemaType('enquiry')
                .child(S.documentTypeList('enquiry').title('All enquiries').defaultOrdering([{ field: 'submittedAt', direction: 'desc' }])),
            ]),
        ),
      S.documentTypeListItem('redirect').title('Redirects'),
      S.divider(),
      S.listItem().id('all').title('All pages (A–Z)').icon(EditIcon).child(docList('All pages', '_type == "page"')),
    ]);
}

export const structure: StructureResolver = (S, context) =>
  context.documentStore
    .listenQuery(QUERY, {}, { apiVersion, perspective: 'published' } as never)
    .pipe(map((data) => build(S, (data ?? { settings: null, pages: [] }) as Data)));
