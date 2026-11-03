# Milovi School — first-pass semantic image audit (2026-11-03)

**Scope:** exact source `main@4fcf206882f1ee30ba66dfadb395fd4eda083da4` before the corrections. Visual inventory of every raster first; then two grounded interventions: one reciprocal filename/content mismatch and one misleading Fantastik editorial image confirmed against chef-authored recipe morphology. This report is not an assertion of photographic provenance for all assets.

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

**Minimal correction for this pair:** swap the *file contents* of the two existing WebPs. Keep stable semantic filenames, article references, image dimensions, alt relationships, site identity and existing AI-editorial image styling. No generation is needed for these two images.

**Content hashes, for reproducibility:**
- The correct *savarin* content has SHA-256 `7600421D88C6C9AF69EF045D1EE3B20F1203E0A1F6065193B796F437CBF2A687` (was in `recipe-pain-perdu.webp`).
- The correct *pain perdu* content has SHA-256 `A0C9F8D0319A7DB8B71CA32CBE9104C65B5C13C0BE98DBDA0D774DEC0074E7BB` (was in `recipe-savarin.webp`).

## Targeted chef-original check: Fantastik

The `michalak-fantastik` article refers to the characteristic Fantastik format of Christophe Michalak. The former `michalak-fantastik.webp` depicted disconnected, saturated rainbow-colored icing rosettes and berries on a bare plate, without an identifiable baked tart or sponge base. The issue is *structural recognition of the named dessert*, not the plate, lighting, or a preference for muted color.

- [Michalak's Fantastik recipe published by Elle & Vire](https://www.elle-et-vire.com/fr/fr/recettes/fantastik/) specifies a compact 20 cm sable base and cheesecake/cream topping.
- [Fantastik abricot-mûre-dragée by Christophe Michalak, Académie du Goût](https://www.academiedugout.fr/recettes/fantastik-abricot-mure-dragee_8475_2) specifies almond crisp, pain de Gênes sponge and a fruit/cream composition.
- [Fantastik figue-poire-pécan by Christophe Michalak, Académie du Goût](https://www.academiedugout.fr/recettes/fantastik-figue-poire-pecan_12005_2) specifies a baked lemon Linzer tart base, cream and fresh fruit.

**High-confidence semantic correction:** replace just `public/images/articles/michalak-fantastik.webp` with a fresh **GPT Image-generated original editorial illustration**, not a copy of a particular Michalak photograph or a claim that his team made this exact product. The new image visibly shows a round baked tart base supporting natural piped vanilla cream, berries, apricot and restrained floral garnish. Original layout, route, image filename, image dimensions (1280 × 800), schema semantics and article text remain unchanged.

Hashes for reproducibility: previous SHA-256 `457EE554B9CB1890CEBAA8418DFF7B5876766FDFF245A23218543495683D7F8E`; new SHA-256 `D6C5BAFB74994AC55FF7ACBEBA6457E0B3DAD7AEA508F36186EF37A89047E259`.

## Owner-approved eight-image editorial update (2026-11-04)

After a full semantic survey of the article and site artwork, the site owner approved the eight *separate full-resolution original GPT Image outputs* below. They are photographic-style **AI editorial illustrations**, not historical originals, photographs taken in a named chef's kitchen, official product photographs, or evidence of an endorsement. The approved PNG sources were converted lossily to WebP quality 94 at their **native 1448 x 1086** pixel dimensions, with no upscaled contact-sheet crops and no discarded top/bottom image areas. Stable article filenames, routes, metadata/alt relationships and page logic remain unchanged. Their actual widths and heights are registered in the code.

| Replaced article illustration | Approved subject | SHA-256 of shipped WebP |
|---|---|---|
| `lignac-kouign-amann.webp` | Kouign-amann | `7988730b358c332c8ce7fa0b05db199c2bc0828ac407ca195a69bd5e1844dd03` |
| `michalak-religieuse.webp` | Religieuse caramel | `dee9057e4be371627fbfe366879ae891a9398e21ce4b3335740ebed7dcfe998a` |
| `grolet-raspberry-rose.webp` | Raspberry Rose | `e86a0c03ca6f46f17cd841ddc8f4c2ed1e7c526a9a1a2198e2f723503c0d6eb7` |
| `recipe-tarte-citron-grolet.webp` | Lemon tart | `33603515c86eb97f96adb0af68f2298a9be4f44306911d01e01acfd51dc180fd` |
| `recipe-saint-honore.webp` | Saint-Honore | `ccedc84ab91ca6c97c8a8e10fe46e59fcac3a074b8ce30a2c22e0f716e24565a` |
| `millefeuille-histoire.webp` | Mille-feuille general history | `d347ac976b010ce6755b8325c8b7665642e7bca9453d41fd14e09fe0eb28e44a` |
| `recipe-opera-dalloyau.webp` | Opera | `e87acec3669f25aaee6aad0f40cd9a49f78e6e372a58f5228e168ccb42ba3127` |
| `recipe-tarte-tatin.webp` | Tarte Tatin | `1a55da707a03045cd0769e366c4fcd4cf80bd9d6066c0b0d20d210a72cebb034` |

Mapping choice: a classic caramelized Breton kouign-amann for the Lignac technique article, caramel religieuse for Michalak, sculpted Raspberry Rose for Grolet, a lemon tart with visible baked shell for Grolet's tart recipe, Saint-Honore with caramelized choux, a general mille-feuille for the *history* article (not an assertion of inverted puff-pastry technique), layered Opéra for the Dalloyau recipe, and a caramelized apple Tarte Tatin for the recipe.

**Specific identity caution: Cédric Grolet's sculpted lemon is itself legitimate on a tart base.** The source article calls for a tart, and the selected image has a visible pastry shell. Sources: [Grolet tart sculptée citron](https://cedric-grolet.com/saint-tropez/produit/tarte-sculptee-citron25/) and [Grolet tartelettes citron jaune](https://www.academiedugout.fr/recettes/tartelettes-citron-jaune_13633_2).

### Excluded from owner approval: Equinoxe

The earlier draft PR had also contained a different generated Equinoxe proposal. **The owner did not approve that image**, so the file was restored from production main. Do not publish the old proposal silently. It remains an editorial candidate requiring comparison with [Cyril Lignac's actual Equinoxe](https://lapatisseriecyrillignac.com/fr/la-patisserie/20-equinoxe-lignac.html), including the characteristic red droplets, dark velvet finish, contrasting vanilla mousse and natural, continuous caramel insert.

### Other verified candidate subjects not changed in this PR

- **Dominique Ansel DKA**, whose original is a squat, rounded, caramelized-top laminated pastry: [original product](https://dominiqueanselonline.com/products/4pc-dka-dominiques-kouign-amann-gift-box). The approved *traditional kouign-amann* image should **not** be misrepresented as his particular DKA.
- **Conticini's iconic Paris-Brest**, composed of individual connected choux and praline filling: [official pastry](https://philippeconticini.fr/pages/paris-brest). The separate historical article illustrated by a *verrine* is correctly about a verrine and was not changed.
- **Tarte au sucre** remained unmodified since plausible Northern French styles match its existing illustration.
- The orphan old *unknown image* is repository-hygiene debt, not a missing pastry representation.

## Negative findings / limits

The initial 248-raster contact-sheet pass was a *triage*, not a universal provenance attestation. A subsequent source-specific pass identified more candidate mismatches. Eight owner-approved article illustrations are replaced above; unapproved cases are explicitly retained as candidates instead of being silently changed. Some images are stylistic illustrations of historical subjects or modern pastry interpretations, and are not photographs of an original chef's specific product. Do **not** treat aesthetics, backdrop, small plating differences, or a noncanonical but plausible variant as a defect.

This is a **semantic triage of every raster at thumbnail size**, not 248 independent original-product photographic identifications. If a particular chef-branded image must represent an exact historical work, it requires its own source-specific comparison and rights/provenance judgment; those are not automatically authenticated by the first-pass gallery review.

## Closure gates

- Build and permanent audits via `npm run validate`.
- CI and source/browser/gallery checks for the exact candidate SHA.
- Verified release workflow and live `/release.json` SHA parity before claiming production is corrected.
