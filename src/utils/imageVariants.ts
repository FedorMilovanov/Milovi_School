import { IMAGE_VARIANT_WIDTHS } from '../data/imageVariants.generated'

/**
 * `srcset` for card-sized imagery, built from the derivative manifest.
 *
 * Cards render article heroes at roughly 300–430 CSS px but the sources are
 * 1280–1698 px wide (200–390 KB each). The gallery served ~6.8 MB of images on
 * the first view of `/materials/` this way, and the article page showed a 4.07×
 * oversampling ratio in a related-card slot.
 *
 * The manifest (`src/data/imageVariants.generated.ts`) is written by
 * `scripts/generate_image_variants.mjs` and lists the widths that actually exist
 * on disk, so a component never emits a candidate that would 404 — and a source
 * narrower than a step simply does not advertise it.
 */
const VARIANT_DIR = '/images/variants'

/**
 * Card slot widths, mobile first: a single column on phones, two on tablets and
 * four to five in the gallery grid on desktop.
 */
export const CARD_SIZES = '(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 24vw'

export function variantSrcSet(src: string): string | undefined {
  const widths = IMAGE_VARIANT_WIDTHS[src]
  if (!widths || widths.length === 0) return undefined
  const name = src.slice(src.lastIndexOf('/') + 1, -'.webp'.length)
  return widths.map((width) => `${VARIANT_DIR}/${name}-${width}.webp ${width}w`).join(', ')
}

/**
 * A single variant URL for contexts that cannot express `srcset` — a CSS
 * `background-image`, for instance. Returns the smallest available width, which
 * is what a blurred placeholder wants anyway.
 */
export function variantUrl(src: string, preferredWidth?: number): string | undefined {
  const widths = IMAGE_VARIANT_WIDTHS[src]
  if (!widths || widths.length === 0) return undefined
  const width = preferredWidth && widths.includes(preferredWidth)
    ? preferredWidth
    : Math.min(...widths)
  const name = src.slice(src.lastIndexOf('/') + 1, -'.webp'.length)
  return `${VARIANT_DIR}/${name}-${width}.webp`
}
