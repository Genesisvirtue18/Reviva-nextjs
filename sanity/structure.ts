import type { StructureResolver } from 'sanity/structure';

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Reviva')
    .items([
      S.listItem().title('Site Settings').id('siteSettings').child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.divider(),
      S.listItem()
        .title('Pages')
        .schemaType('page')
        .child(S.documentList().title('Pages').filter('_type == "page" && pageType != "blog"').defaultOrdering([{ field: 'path', direction: 'asc' }])),
      S.listItem()
        .title('Blog posts')
        .schemaType('page')
        .child(S.documentList().title('Blog posts').filter('_type == "page" && pageType == "blog"').defaultOrdering([{ field: 'path', direction: 'asc' }])),
      S.divider(),
      S.documentTypeListItem('enquiry').title('Enquiries'),
    ]);
