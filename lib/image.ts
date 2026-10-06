/* Image fields: an uploaded Sanity image wins; otherwise the original file
   from the old site (`src`) is used. URLs are built from the asset id
   (image-<id>-<w>x<h>-<ext>), so no extra request is needed. */

export type SanityImage = { asset?: { _ref?: string } } | null | undefined;

export function imageUrl(image: SanityImage): string | null {
  const ref = image?.asset?._ref;
  const m = ref?.match(/^image-([a-f0-9]+-\d+x\d+)-(\w+)$/);
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
  return m && projectId ? `https://cdn.sanity.io/images/${projectId}/${dataset}/${m[1]}.${m[2]}?auto=format` : null;
}

/** A picture field: { image (upload), src (original file), alt }. */
export type Picture = { image?: SanityImage; src?: string; originalAssetId?: string; alt?: string };

/** The URL to show: a newly uploaded image, else the original file. */
export function pictureSrc(p?: Picture | null): string | undefined {
  if (!p) return undefined;
  const ref = p.image?.asset?._ref;
  if (ref && ref !== p.originalAssetId) return imageUrl(p.image) ?? p.src;
  return p.src;
}
