# Milovi School — first-pass semantic image audit (2026-11-03)

**Scope:** exact source `main@4fcf206882f1ee30ba66dfadb395fd4eda083da4` before the correction. Read-only visual inventory first; then a narrowly scoped correction of one demonstrable mismatch pair. This report is not an assertion of photographic provenance for all assets.

## Method and coverage

- Enumerated `public/images`: **255 files**, including **248 raster images**: **223 article images**, **16 Le Canon Sucré images** (15 items plus collection hero), **9 root-level raster assets**; remaining 7 are not raster images.
- Rendered *all 248 rasters* into contact sheets and visually inspected the displayed subjects at first-pass thumbnail size. Enlarged the confirmed mismatch pair at original resolution.
- Cross-matched image basenames with the article sources; **246/248** raster basenames were mentioned in `src/`, with the two unmentioned files being `logo-192.png` and `logo-maskable.png` (PWA identity assets). **No byte-identical raster duplicates**.
- Verified the two affected article image bindings at `src/data/articles.ts`. Both image files are WebP at the same dimensions, **1695 × 928**, according to `src/data/articleImageDimensions.ts`.
- Compared the salient *type-defining morphology* of the confirmed mismatches with independent culinary references. Examples: [Larousse, savarin à la crème](https://www.editions-larousse.fr/recette/savarin-la-creme/) and [Les Céréales, pain perdu](https://www.lescereales.fr/recette/pain-perdu-pain-crotte).

## Confirmed errors (not taste or styling differences)

| Article / image file before fix | What the file actually depicts | Expected subject |
|---|---|---|
| `recipe-savarin` → `recipe-savarin.webp` | Golden, caramelized **rectangular thick bread slices**, with syrup poured over them: *pain perdu* | **Savarin**: rum/syrup-soaked yeast cake, typically a ring, optionally with cream/fruit |
| `recipe-pain-perdu` → `recipe-pain-perdu.webp` | Golden, syrup-glazed **ring cake** filled with Chantilly and berries: *savarin* | **Pain perdu**: custard-soaked, pan-fried slices of bread or brioche |

**Root cause:** the contents of the two source image assets had been assigned to the opposite semantically named files. The article-to-file references themselves were consistent; modifying React or client routing was unnecessary.

**Minimal correction:** swap the *file contents* of the two existing WebPs. Keep stable semantic filenames, article references, image dimensions, alt relationships, site identity and existing AI-editorial image styling. No new images, no GPT Image generation, no unrelated article changes.

**Content hashes, for reproducibility:**
- The correct *savarin* content has SHA-256 `7600421D88C6C9AF69EF045D1EE3B20F1203E0A1F6065193B796F437CBF2A687` (was in `recipe-pain-perdu.webp`).
- The correct *pain perdu* content has SHA-256 `A0C9F8D0319A7DB8B71CA32CBE9104C65B5C13C0BE98DBDA0D774DEC0074E7BB` (was in `recipe-savarin.webp`).

## Negative findings / limits

The other first-pass images did **not** show another sufficiently certain wrong-dessert substitution to justify a replacement. Some images are stylistic illustrations of historical subjects or modern pastry interpretations, and are not photographs of an original chef's specific product. Do **not** treat aesthetics, backdrop, small plating differences, or a noncanonical but plausible variant as a defect.

This is a **semantic triage of every raster at thumbnail size**, not 248 independent original-product photographic identifications. If a particular chef-branded image must represent an exact historical work, it requires its own source-specific comparison and rights/provenance judgment; those are not automatically authenticated by the first-pass gallery review.

## Closure gates

- Build and permanent audits via `npm run validate`.
- CI and source/browser/gallery checks for the exact candidate SHA.
- Verified release workflow and live `/release.json` SHA parity before claiming production is corrected.
