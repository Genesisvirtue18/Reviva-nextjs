import { defineField, defineType } from 'sanity';
import { ImageIcon } from '@sanity/icons/Image';
import { ImageUrlInput } from '../components/ImageUrlInput';

/* Upload images for use in page HTML: upload, copy the URL, then use it as an
   <img src="..."> in "Page content". Existing images keep their
   /assets/images/... paths. */
export const imageAsset = defineType({
  name: 'imageAsset',
  title: 'Image',
  type: 'document',
  icon: ImageIcon,
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'image', type: 'image', validation: (r) => r.required() }),
    defineField({ name: 'alt', title: 'Alt text (describe the image)', type: 'string' }),
    defineField({
      name: 'url',
      title: 'Image URL',
      type: 'string',
      description: 'Paste this into a page as <img src="URL" alt="...">.',
      components: { input: ImageUrlInput },
    }),
  ],
  preview: { select: { title: 'title', media: 'image' } },
});
