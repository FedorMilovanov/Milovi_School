# TEMP DESIGN AUTHORITY — LE CANON SUCRÉ

> **STATUS: TEMPORARY / WORKING DESIGN AUTHORITY / MUST BE DELETED AFTER IMPLEMENTATION**
>
> Этот файл нужен только на фазе проектирования и реализации `Le Canon Sucré`. Он не является постоянной документацией продукта и не должен пережить завершение отдела.
>
> **Обязательное правило удаления:** удалить этот файл после того, как одновременно выполнены все условия:
> 1. `/canon/` реализован и принят визуально;
> 2. homepage gateway реализован и принят на desktop/mobile;
> 3. collection navigation внутри статей реализована;
> 4. research-transfer по 15 объектам завершён;
> 5. QA по accessibility/performance/reduced-motion пройден;
> 6. устойчивые решения, которые действительно нужны проекту, перенесены в код, tests или существующую постоянную документацию.
>
> После выполнения этих условий файл должен быть **удалён**, а не переименован в `FINAL`, `V2`, `ARCHIVE` и т. п. Не создавать рядом `PASS_1`, `FINAL_FINAL`, `NOTES_OLD` и аналогичный мусор.

---

## 1. Product intent

`Le Canon Sucré` — не пятая категория сайта и не ещё одна галерея материалов.

Это **отдельная редакционная коллекция / цифровая выставка** внутри Pâtisserie Russe, которая объединяет 15 канонических форм французской pâtisserie в один кураторский маршрут.

Основной принцип:

**богатство Research находится за интерфейсом; интерфейс показывает только сильнейшие 10–15% материала.**

Визуальный ориентир: не ресторанная реклама и не «AI luxury», а смесь:

- musée / exhibition design;
- high-end French editorial;
- haute pâtisserie;
- restrained cinematic product photography;
- typography-first luxury layout.

Ключевые слова: **air, rhythm, form, archive, precision, restraint, materiality**.

---

## 2. Information architecture

### Homepage

Предпочтительный порядок:

1. Hero
2. Stats
3. Existing 4 main directions
4. **Le Canon Sucré gateway**
5. Continue Reading
6. Existing personal / archive blocks
7. Footer

Canon не встраивается пятой карточкой в текущую сетку четырёх направлений.

### Route

Основной маршрут:

`/canon/`

Не использовать `/#canon`, `/materials/?category=canon` или новую category как основную архитектуру.

### Data model

Canon должен быть collection-layer поверх существующих article IDs.

Одна статья может одновременно оставаться в своей основной категории (`pierre-herme`, `histoire-culinaire`, etc.) и входить в `Le Canon Sucré`.

Не создавать SEO-дубли существующих статей ради коллекции.

---

## 3. Homepage gateway

### Role

Gateway — не мини-страница и не poster. Это **приглашение войти в выставку**.

### Desktop geometry

Ориентир:

- max width: ~1480–1540 px;
- aspect: примерно 3.7:1–4.1:1;
- visual height: ~340–390 px на крупном desktop;
- большие внешние вертикальные паузы;
- не растягивать бесконечно на ultrawide.

### Image strategy

Финальный image asset не содержит текста.

Изображение содержит только:

- background;
- light;
- 4–5 iconic pastry forms;
- restrained pedestals / stone surfaces;
- controlled negative space.

Текст — настоящий HTML поверх media.

Рекомендуемые silhouette anchors:

1. Saint-Honoré
2. Opéra
3. Ispahan
4. Mont-Blanc
5. Galette des Rois

Причина выбора: разные геометрии — tower / rectangle / disc / dome / large circle.

Не пытаться впихнуть все 15 объектов в gateway.

### Gateway text

Eyebrow:

`ÉDITION SPÉCIALE`

Title:

`LE CANON SUCRÉ`

Subtitle (рабочая версия):

`15 форм, ставших языком французской pâtisserie`

Metadata:

`15 PIÈCES · 3 ACTES`

CTA:

`Открыть коллекцию →`

Не добавлять абзац объяснения внутрь gateway.

---

## 4. Gateway interaction contract

### Rest state

- media slightly subdued;
- low-contrast gold frame;
- title readable without hover;
- CTA visible from the start;
- no autoplay animation.

### Desktop hover

Use only under `(hover: hover) and (pointer: fine)`.

Allowed:

- image scale ~1.015–1.02;
- subtle brightness/contrast lift;
- controlled directional light following pointer at very low amplitude;
- border drawing from opposite corners;
- eyebrow tracking increase;
- tiny warm title glow;
- CTA underline extension;
- arrow translate ~5–7 px;
- optional micro perspective / tilt, maximum ~1–1.5 degrees.

### 3D tilt rule

3D tilt is **not a global visual language**.

Use it only when it strengthens physical-object perception.

Allowed locations:

1. homepage Canon gateway — extremely subtle;
2. 2–3 anchor works on `/canon/` — subtle card/media tilt;
3. archival facsimile viewer — micro perspective as “document under museum glass”.

Forbidden:

- all 15 cards;
- navigation;
- timeline;
- text blocks;
- mobile;
- reduced-motion mode.

Tilt limits:

- max rotateX/rotateY: ~1.5–2deg;
- no spring bounce;
- transform origin follows pointer softly;
- reset easing must be slower than enter;
- perspective should feel optical, not game-like.

### Focus state

Keyboard focus must be visually complete without relying on hover.

- clear frame;
- CTA accent;
- no required motion;
- no hidden information.

### Touch state

No hover emulation.

- dedicated mobile artwork / crop;
- optional `:active` scale around 0.992;
- instant comprehension in rest state.

### Reduced motion

If `prefers-reduced-motion: reduce`:

- no scale;
- no tilt;
- no parallax;
- no pointer-follow light movement;
- retain static border/contrast/focus changes only.

---

## 5. `/canon/` opening sequence

The page should feel like entering an exhibition.

### Hero

Small line:

`PÂTISSERIE RUSSE · COLLECTION 01`

Large title:

`LE CANON`  
`SUCRÉ`

Intro line:

`15 десертов. Три акта. Формы, техники и переосмысления, ставшие профессиональным языком.`

Numeric metadata may only use facts closed by Research.

Do not publish decorative dates, city counts or centuries until research has confirmed them.

### Hero movement

Preferred sequence on first paint:

1. background/media already present;
2. eyebrow fade/translate 6–8 px;
3. title reveal through mask/clip, not letter-by-letter gimmick;
4. subtitle fade;
5. metadata line appears last.

Total perceived animation should be short and calm.

No loader screen.
No mandatory intro.
No scroll-jacking.

---

## 6. Manifesto

Immediately after hero:

### `Qu’est-ce qu’un canon ?`

Purpose: explain selection logic.

Core idea:

Canon is not a ranking of “best desserts”. It is a collection of forms that survived their creator, codified a technique, became a professional reference, acquired cultural/geographic significance, or were reinterpreted strongly enough to influence modern pâtisserie.

Keep this section short and typographically generous.

---

## 7. Canon index

Before the three acts, provide a compact 01–15 index.

Not tiles.

Prefer typographic rows / columns:

`01 Saint-Honoré`
`02 Paris-Brest`
...

Interaction:

- hover number becomes gold;
- name moves 2–4 px;
- optional one-line technique descriptor appears;
- click scrolls to object within `/canon/`;
- keyboard fully supported.

This is navigation, not a gallery.

---

## 8. Three acts

Working structure:

### ACTE I — LA FORME

**Когда конструкция стала языком.**

- Saint-Honoré
- Paris-Brest
- Religieuse
- Éclair
- Opéra

### ACTE II — LA SIGNATURE

**Когда классика обрела автора или Maison.**

- Baba au Rhum
- Tarte au Citron
- Ispahan
- 2000 Feuilles
- Mont-Blanc

### ACTE III — LE TERRITOIRE

**Когда место, сезон и ритуал стали частью формы.**

- Kouign-Amann
- Tarte Tatin
- Tarte Tropézienne
- Canelé
- Galette des Rois

This grouping remains provisional until Research transfer is reviewed.

---

## 9. Act layout rhythm

Do NOT render five equal cards.

Each act should have:

- one anchor work;
- two medium works;
- one quieter editorial work;
- one closing work or wide work;
- at least one strong negative-space interval.

Possible anchors:

- Act I: Saint-Honoré
- Act II: Ispahan
- Act III: Canelé or Galette des Rois

Anchor size is compositional emphasis, not a claim that the object is historically “more important”.

Alternate grid direction between acts to avoid template repetition.

---

## 10. Canon work card / museum label

A Canon item should not look like a standard `/materials/` card.

Core label structure:

`01`

`SAINT-HONORÉ`

`PARIS`  
`XIXe SIÈCLE`  
(only when Research confirms)

Technique line:

`PÂTE À CHOUX · CARAMEL · CRÈME`

Curatorial sentence:

One strong sentence explaining why it belongs in the Canon.

CTA:

`Открыть досье →`

Do not display generic blog metadata such as reading time, author list or tag cloud on Canon cards.

---

## 11. Card interactions

### Standard Canon work

Preferred effects:

- image crop changes subtly through scale/position;
- label lifts 4–6 px;
- technique line becomes clearer;
- thin line expands;
- image contrast gently increases.

Do not use blur-replacement hover copied 1:1 from `/materials/`.

### Anchor works

Anchor works may add micro 3D tilt.

Tilt is applied to the media plane / presentation slab, not to text.

Optional depth layers:

- background plane;
- pastry media;
- museum label.

Maximum separation should remain visually subtle.

No floating-card gaming effect.

---

## 12. Anatomy reveal

For selected works, hover/focus may reveal a tiny technical legend:

Example:

`01 · CARAMEL`
`02 · CHOUX`
`03 · CRÈME`

Rules:

- only factual anatomy from Research;
- never hide essential content behind hover;
- on touch, anatomy appears through explicit button/expand affordance if retained;
- no fake X-ray effect.

Potential premium effect: ultra-thin leader lines that fade in from labels toward the dessert silhouette.

Use only for objects whose composition is visually understandable.

---

## 13. Archive interludes

Historical facsimiles should interrupt the modern photography rhythm.

Preferred pattern:

`ARCHIVE 03`

[real document / page / menu / advert]

`Paris · 18xx`

Short caption + institution/source.

### Facsimile visual treatment

The document should feel like a real object under museum glass.

Allowed effects:

- 0.5–1deg resting rotation on desktop;
- pointer-follow micro perspective;
- subtle glass glare, extremely restrained;
- shadow depth;
- click to open a clean reading viewer.

### Facsimile viewer

Click opens a modal/lightbox-style reading layer:

- dark neutral surround;
- high-res document centered;
- zoom controls;
- caption/source/rights always visible;
- Escape closes;
- focus trapped correctly;
- background scroll locked;
- mobile supports pinch/zoom only if implementation is robust; otherwise simple responsive zoom controls.

Do not simulate page curl or fake paper aging if the source object already has real texture.

No facsimile may be used until rights state allows public use.

---

## 14. LÉGENDE / DOCUMENT

For historically disputed stories, use a signature editorial comparison.

Do not use red/green fact-check visual language.

Preferred labels:

`LÉGENDE`

vs

`DOCUMENT`

Interaction can be a controlled split reveal:

- left side legend;
- right side documentary evidence;
- on hover/focus the documentary side gains weight;
- on mobile both stack vertically.

No “FALSE” badges.
No sensational debunking tone.

---

## 15. Timeline

Timeline should appear after users already know many objects, likely between Act II and Act III or after Act III depending on research density.

Do not lead the page with 15 unexplained dates.

Preferred form:

- vertical editorial timeline;
- sparse dates;
- only documentary milestones;
- no forced one-date-per-dessert simplification.

Hover can highlight connected work names but should not be necessary for comprehension.

No horizontal drag carousel as primary timeline.

---

## 16. Atlas du Canon

Near the final third of the page, add a restrained France/Europe editorial map if Research produces sufficiently strong place evidence.

Preferred treatment:

- custom SVG;
- dark/light theme aware;
- no Google Maps visual language;
- city dots + names;
- hover/focus reveals object relation.

Potential locations:

- Paris
- Maisons-Laffitte
- Douarnenez
- Bordeaux
- Lamotte-Beuvron
- Saint-Tropez

Only confirmed locations enter the final atlas.

No decorative location pins without evidence.

---

## 17. Technique matrix

Near page end, use an educational matrix showing shared techniques across the 15 works.

Possible rows:

- choux
- feuilletage
- caramel
- praliné
- meringue
- brioche
- fermentation
- émulsion
- crème
- cuisson moulée

Visual approach:

- thin grid;
- dots/marks rather than spreadsheet cells;
- hover a technique -> related dessert names brighten;
- hover a dessert -> its techniques brighten;
- keyboard equivalent required.

This section should reveal the Canon as a **system of techniques**, not merely a list of famous desserts.

---

## 18. End sequence / Hors Canon

Before the main site footer:

`15 / 15`

`LE CANON CONTINUE.`

Short line explaining that pâtisserie and canon are not static.

Then optional restrained `HORS CANON` teaser using Research reserve candidates.

Do not show a second full gallery.

Possible reserve names only after Research review.

Purpose:

explain why strong objects may remain outside the core 15.

---

## 19. Collection navigation inside articles

If an article belongs to Canon, article page gets a collection context bar.

Top context:

`LE CANON SUCRÉ`

`06 / 15 · ACTE II · LA SIGNATURE`

Bottom navigation:

`← 05 OPÉRA`  |  `VOIR LE CANON`  |  `07 2000 FEUILLES →`

This is essential for readers entering directly from search engines.

Do not duplicate article bodies under `/canon/`.

---

## 20. Page transitions

### Homepage -> Canon

Preferred:

- normal navigation remains reliable;
- optional visual continuity: gateway image darkens/fades while `/canon/` hero starts from a related tonal state;
- do not depend on experimental view transitions for correctness.

No fake 2-second cinematic interstitial.

### Canon -> article

Use immediate navigation with optional short opacity/media transition.

Do not animate the whole document across routes if it harms perceived speed.

### Within Canon

Scroll reveals should use:

- opacity;
- 8–16 px translate;
- occasional clip reveal;
- stagger only in small local groups.

Avoid animating every paragraph.

---

## 21. Motion budget

The page should feel alive because motion is **hierarchical**, not because everything moves.

Three motion tiers:

### Tier A — Signature

Used rarely:

- homepage gateway;
- Canon hero;
- 2–3 anchor works;
- archival viewer opening.

### Tier B — Editorial

Common but restrained:

- line growth;
- image scale 1.01;
- label lift;
- opacity reveal;
- technique highlight.

### Tier C — Static

Most body content.

If more than ~20–25% of the viewport is moving simultaneously, the design is probably too busy.

---

## 22. Visual material system

Core materials:

- graphite;
- warm stone;
- dark marble used sparingly;
- paper/ivory for archive documents;
- muted old gold;
- very small cool blue rim accents inherited from site identity.

Avoid:

- shiny black glass everywhere;
- heavy gold borders;
- gold leaf on every pastry;
- excessive bloom;
- chromatic aberration;
- fake dust particles;
- generic luxury gradients;
- glassmorphism stacking.

Dark does not mean pure black everywhere. Preserve material detail and readable shadow separation.

---

## 23. Typography

Do not introduce a new display font unless absolutely necessary.

Prefer existing project system:

- Cormorant Garamond / Playfair fallback for editorial serif;
- JetBrains Mono for labels, numbers, archive metadata and technique systems.

Use French uppercase as structural language, Russian as explanatory language.

Do not write whole Russian paragraphs in all caps.

Large titles require careful line breaks and optical spacing.

---

## 24. Theme behavior

Canon should respect the site-wide theme preference.

However, specific exhibition panels may remain dark in both themes.

Light theme:

- page background can remain warm ivory;
- gateway / anchor exhibition panels can be dark graphite;
- archives can use natural paper tone.

Dark theme:

- avoid flattening everything into black;
- preserve warm stone/ivory interruptions.

Do not force dark mode for the whole route.

---

## 25. Performance rules

Premium must not mean heavy.

- gateway image below fold may be lazy-loaded;
- `/canon/` hero should be prioritized as LCP candidate;
- use real `<picture>` / responsive source strategy for art direction;
- separate desktop/mobile artwork if composition materially changes;
- avoid giant background PNGs;
- prefer WebP/AVIF where pipeline allows;
- no WebGL unless later research/design proves a unique need;
- no particle canvas;
- no continuously running pointer listeners when element is offscreen;
- disable pointer-reactive effects outside fine-pointer media queries;
- use IntersectionObserver for activation where needed.

---

## 26. Accessibility rules

Premium interactions must have keyboard/touch equivalents.

- all gateway/card actions are semantic links/buttons;
- visible focus state;
- no essential information hover-only;
- reduced motion respected;
- touch targets >= comfortable mobile size;
- archive viewer has Escape, focus trap and readable controls;
- contrast remains sufficient over imagery;
- captions and provenance remain selectable text;
- decorative images have appropriate alt strategy; article hero alt remains factual.

---

## 27. Research transfer gate

Do not finalize historical labels until the Research corpus returns.

For each Canon work, design expects the following editorial payload:

- canonical display name;
- validated place(s);
- validated dates/milestones;
- one-line “why canon”;
- anatomy;
- technique list;
- myth/document status when relevant;
- 1–3 archive candidates;
- rights status;
- reserve/replacement recommendation.

Research evidence must be edited into concise public copy before entering UI.

Research output is not pasted wholesale into `/canon/`.

---

## 28. Implementation blacklist

Do not ship:

- fifth category card on homepage;
- autoplay video hero;
- sound;
- scroll-jacking;
- horizontal-scroll-only page;
- 15 identical cards;
- 15 simultaneous 3D tilts;
- cursor particles;
- gold dust;
- excessive glow;
- unreadable hover-only labels;
- mandatory animation for navigation;
- fake historical texture;
- timeline dates not closed by Research;
- archived images without item-level rights decision;
- duplicate Canon article routes competing with existing canonical articles.

---

## 29. Acceptance criteria before deleting this file

This temporary design authority may be deleted only after final implementation demonstrates:

- homepage gateway is visually premium in light/dark desktop/mobile;
- gateway hover/focus/touch/reduced-motion states all exist;
- `/canon/` has a clear exhibition hierarchy;
- three acts feel visually distinct but coherent;
- standard works and anchor works have different interaction weight;
- archive interludes work without rights ambiguity;
- article collection navigation is live;
- no duplicate article SEO architecture;
- LCP/CLS/interactivity remain acceptable;
- no effect exists only because “we can technically do it”;
- visual QA confirms that motion supports hierarchy rather than competing with content;
- persistent decisions have been moved into code/tests/permanent project documentation where necessary.

Then DELETE this file.
