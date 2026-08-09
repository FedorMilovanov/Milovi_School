# Le Canon Sucré — Image Prompt Bible

Единый production-бриф для изображений коллекции **Le Canon Sucré**. Изображения должны выглядеть как музейная редакционная съёмка французской pâtisserie, а не как рекламный food-shot или декоративная AI-фантазия.

## 1. Технический контракт

- master: **1280×800 px, 16:10**;
- production format: **WebP**;
- production path: `public/images/canon-sucre/<canon-id>.webp`;
- главный десерт и критические детали держать в центральных **55–60% ширины**;
- крайние **18–20%** слева и справа считать crop-safe зоной без критических деталей: тот же source используется в разных exhibition crops;
- один основной объект на кадр; дополнительные элементы только если объясняют технику;
- без текста в кадре, логотипов, брендинга и watermarks;
- без рук/лиц;
- геометрия, слои, крем, карамель и мякиш должны быть технологически правдоподобными;
- никакой «идеальной пластиковой еды»: допустимы естественные микро-неровности, но не дефекты формы.

`canon-media.ts` является единственной authority для exhibition media. Не заменять и не перезаписывать существующие `public/images/articles/*` ради Canon.

## 2. Общий visual DNA

Добавлять к каждому prompt:

> premium editorial French pâtisserie photography, museum-like presentation, historically respectful and technically believable pastry, dark graphite and warm stone background, muted old-gold reflections, subtle cool blue rim light, soft cinematic side lighting, deep but readable shadows, elegant restrained composition, realistic butter, caramel, cream and pastry micro-textures, natural imperfections, high-end culinary magazine photography, 85mm food photography, shallow but controlled depth of field, crisp focal plane on the dessert, no artificial plastic gloss, no excessive props, no human hands, no visible branding, no text, no logo, no watermark, centered crop-safe composition, important details inside the central 60 percent of the frame, 16:10 landscape

### Global negative

> cartoon, illustration, CGI look, plastic food, fake glossy cream, melted geometry, deformed pastry, duplicated elements, impossible layers, random berries, excessive flowers, excessive powdered sugar, cluttered table, restaurant advertising banner, visible brand logo, typography, labels, watermark, hands, faces, cutlery crossing the dessert, oversaturated colors, orange color cast, blown highlights, crushed black shadows, extreme bokeh hiding the dessert, fisheye, top-down flat lay unless explicitly requested

---

## 00 — Optional collection still life

Текущий `/canon/` использует типографический hero, поэтому отдельный hero-image **не является обязательной частью pack**. Если позднее понадобится самостоятельный collection still life, использовать target `public/images/canon-sucre/hero.webp`, но подключать его только отдельным осознанным design-pass.

> A museum-like editorial still life representing the canon of French pâtisserie: several unmistakable pastry silhouettes displayed with generous negative space on a long dark stone table — a caramelized Saint-Honoré crown, a precise rectangular Opéra, one deeply caramelized canelé, a rose-pink Ispahan macaron, a burnished galette des rois segment and a laminated pastry detail. No dessert overlaps another. Dramatic low side light reveals caramel, laminated layers, chocolate glaze and cream texture. The composition feels like objects in a design museum, not a bakery counter. Keep the central field calm and crop-safe. No signage or branded packaging.

## 01 — Saint-Honoré

**Target:** `public/images/canon-sucre/saint-honore.webp`

> A canonical French Saint-Honoré presented as a technical masterpiece: thin crisp puff-pastry base, elegant circular crown of evenly sized pâte à choux, each choux capped with transparent amber caramel, refined vanilla cream piped in the center with a Saint-Honoré piping tip. The construction must be readable at a three-quarter front angle. Caramel brittle and glass-like, not sticky; choux dry and crisp; cream silky and stable. No decorative clutter.

## 02 — Paris-Brest / Conticini logic

**Target:** `public/images/canon-sucre/paris-brest.webp`

> A modern reference Paris-Brest inspired by Philippe Conticini's textural logic: low crown assembled from connected round choux with controlled craquelin, toasted hazelnut-praline cream piped precisely, restrained toasted nut fragments. One front segment cleanly opened to reveal a darker slow-flowing praline heart inside lighter praline cream. Strong readable contrast between crisp shell, airy choux, smooth cream and coulant praline.

## 03 — Baba au Rhum

**Target:** `public/images/canon-sucre/baba-au-rhum.webp`

> A refined baba au rhum shown as a study of controlled soaking: one tall fluted baba with deep golden baked surface and delicate apricot glaze, visibly moist but structurally intact. A very small pool of amber rum-citrus syrup catches light around the base without flooding it. Restrained vanilla Chantilly beside the baba, not hiding the crumb. No bottle, label or advertising props.

## 04 — Tarte au Citron / Jacques Genin logic

**Target:** `public/images/canon-sucre/tarte-au-citron.webp`

> A Jacques Genin-style tarte au citron built around purity and emulsion rather than decoration: extremely thin, precise pâte sucrée shell with clean vertical walls; perfectly smooth pale yellow-green citrus cream with a dense satin finish; absolutely no meringue, no torch marks, no whipped topping. A tiny restrained basil leaf or micro basil accent may reference the lime-basil line, but the tart remains visually severe and minimal. The cream should read as a butter-rich citrus emulsion — glossy only from correct texture, never gelatinous or plastic. Show the shell thickness and perfectly level filling in a low three-quarter angle.

**Do not generate:** lemon-meringue pie, large basil garnish, transparent gel, green artificial color, fruit sculpture, Grolet-style trompe-l'œil lemon.

## 05 — Opéra

**Target:** `public/images/canon-sucre/opera.webp`

> A canonical Gâteau Opéra as strict edible architecture: precise low rectangular block, clearly readable horizontal layers of biscuit Joconde, coffee buttercream and dark chocolate ganache, finished with an extremely thin dark glaze. Straight vertical cut, no bulging cream, no oversized chocolate plaque. The visual idea is controlled thickness, repetition and graphic proportion.

## 06 — Ispahan / Pierre Hermé

**Target:** `public/images/canon-sucre/ispahan.webp`

> Pierre Hermé Ispahan as a precise rose-lychee-raspberry composition: large rose-pink macaron shell, ring of fresh raspberries placed evenly around the perimeter, rose cream and lychee readable in a clean cut or restrained opening, one small rose petal only. Pink muted and natural, not neon. Preserve the iconic circular architecture and contrast between crisp macaron, juicy raspberry and smooth cream.

## 07 — 2000 Feuilles / Pierre Hermé

**Target:** `public/images/canon-sucre/2000-feuilles.webp`

> Pierre Hermé 2000 Feuilles presented as an extreme study of lamination and praline texture: long precise rectangular mille-feuille made from deeply caramelized inverse puff pastry, visibly numerous ultra-thin crisp layers, praline mousseline arranged in controlled bands, and a distinct hazelnut-praline feuilletine layer providing granular crunch. One clean cut end faces the camera so the lamination and textural strata remain readable. Surface caramelized and dry, not powdered heavily; cream stable and light enough not to compress the pastry. Museum-like three-quarter macro view.

**Historical constraint:** do not visualize or caption an invented literal explanation for the number “2000”. The image only represents the documented composition and the idea of multiplied lamination/textures.

## 08 — Mont-Blanc

**Target:** `public/images/canon-sucre/mont-blanc.webp`

> A classical Mont-Blanc aux marrons: crisp meringue base, restrained Chantilly dome, extremely fine chestnut vermicelli piped densely and evenly over the surface. The form should feel like a compact mountain without oversized decoration. Chestnut strands matte and slightly fibrous, cream white and soft, meringue visible at one edge or in a clean section.

## 09 — Religieuse

**Target:** `public/images/canon-sucre/religieuse.webp`

> A canonical Religieuse built from two stacked choux of clearly different diameter, both evenly filled and finished with thin coffee or chocolate fondant, joined by a neat buttercream collar. Vertical silhouette perfectly legible, choux dry and inflated, fondant thin and level rather than thick icing. Belle Époque atmosphere should come from restrained lighting and plate choice only — no costumes, signs or theatrical props.

## 10 — Kouign-Amann

**Target:** `public/images/canon-sucre/kouign-amann.webp`

> A deeply caramelized Breton kouign-amann with visibly laminated yeast-dough layers, dark amber crisp exterior and buttery interior. One cut or torn edge reveals separated layers without looking like croissant honeycomb. Caramelization must reach deep amber but not black burn. Minimal setting, warm reflected gold against dark graphite stone.

## 11 — Tarte Tatin

**Target:** `public/images/canon-sucre/tarte-tatin.webp`

> A restrained canonical Tarte Tatin: apples arranged in a coherent concentric structure, deeply but evenly caramelized to copper-amber, sitting above a thin crisp pastry base after inversion. Remove one clean wedge to reveal the apple depth and pastry without collapsing the circle. No ice cream, no caramel waterfall, no decorative mint.

## 12 — Tarte Tropézienne

**Target:** `public/images/canon-sucre/tarte-tropezienne.webp`

> A classic round Tarte Tropézienne: glossy golden brioche with restrained pearl sugar, clean horizontal cut, generous but even band of pale vanilla cream, crumb visibly soft but not cake-like. Mediterranean warmth only in the reflected light; no beach props, sunglasses or tourism imagery.

## 13 — Canelé de Bordeaux

**Target:** `public/images/canon-sucre/canele-bordeaux.webp`

> One canonical Bordeaux canelé with very dark mahogany, almost black caramelized fluted shell and controlled gloss, accompanied by one cleanly cut half showing pale custardy porous interior. A single copper canelé mould may sit far in the background as a technical reference. Exterior must look brittle and baked, not chocolate-coated.

## 14 — Éclair

**Target:** `public/images/canon-sucre/eclair.webp`

> A classical long éclair made from evenly expanded pâte à choux, filled end to end with coffee pastry cream and covered by a thin perfectly level coffee fondant. Optional clean half-cut showing filling distribution. The choux surface remains visible and structurally believable; no giant glaze, mirror coating, fruit pile or modern sculptural toppings.

## 15 — Galette des Rois

**Target:** `public/images/canon-sucre/galette-des-rois.webp`

> A canonical round galette des rois with high but controlled puff pastry lift, deep burnished double egg-wash gloss and precise rayage scored into the top without cutting through the dough. One wedge removed to reveal a thin, even almond frangipane layer between crisp laminated pastry. A tiny fève may be barely visible in the cut section, but no paper crown or festive text in frame.

---

## 3. Calibration order

Перед серийной генерацией калибровать стиль на трёх объектах:

1. **Saint-Honoré** — проверяет choux, caramel, cream и архитектуру.
2. **Ispahan** — проверяет узнаваемый signature-object и сложный muted pink.
3. **Canelé de Bordeaux** — проверяет микротекстуру, глубокую карамелизацию и работу с почти чёрными поверхностями.

После совпадения этих трёх по свету, зерну, глубине теней и уровню реализма переносить тот же visual DNA на остальные 12.

## 4. QC перед коммитом

Каждый финальный asset обязан пройти все пункты:

- [ ] объект технологически правдоподобен;
- [ ] композиция читается без подписи;
- [ ] нет лишних/дублированных элементов AI;
- [ ] нет текста, logo, watermark или branded packaging;
- [ ] центральные 55–60% содержат всю критическую информацию;
- [ ] 4:5 crop не отрезает идентичность десерта;
- [ ] свет не выбивает крем/глазурь в белое пятно;
- [ ] тени сохраняют текстуру;
- [ ] нет чрезмерного orange cast;
- [ ] файл подключён только через `src/data/canon-media.ts`;
- [ ] `npm run audit:media && npm run build && npm run audit:site` проходит после добавления/замены файла.

## 5. Naming и границы

Финальный exhibition pack состоит ровно из 15 dedicated assets:

`public/images/canon-sucre/<canon-id>.webp`

Имена файлов обязаны совпадать с Canon IDs. Media identity и article publication разделены: наличие изображения **не создаёт article route**, а наличие article route не даёт права переиспользовать неподходящий library image.

В частности:

- `tarte-au-citron.webp` остаётся точным exhibition asset для Jacques Genin logic, даже пока отдельное dossier не опубликовано;
- `2000-feuilles.webp` остаётся точным exhibition asset для Pierre Hermé, даже пока отдельное dossier не опубликовано;
- не подменять их Cédric Grolet citron или generic/Conticini/Perret mille-feuille;
- не копировать Canon pack обратно в `public/images/articles/` без отдельной editorial причины.
