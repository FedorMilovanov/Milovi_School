# Le Canon Sucré — Production Closeout

**Статус:** CLOSED / production authority  
**Дата:** 2026-08-10

Этот документ фиксирует финальную границу текущего scope. Он нужен, чтобы будущая работа не открывала заново уже закрытые решения и не смешивала новые Research/Atlas/SEO идеи с завершённым релизом.

## Release state

Product transfer вошёл в `main` через release merge:

- `2a492b11d6c5e52728675ce797cc5c80583d345d` — Le Canon Sucré production release;
- `9bf68c32c2c582c47f57e7975969a507340f02c5` — SEO 2026 image discovery/provenance/sitemap hardening.

На момент closeout оба production status contexts (`pages/release-proof` и `gallery/quality`) зелёные на текущем SEO release SHA.

## Закрытый Product scope

- **15/15 Canon works**;
- **15/15 dedicated WebP** в `public/images/canon-sucre/`;
- **15/15 реальных article routes**;
- два отдельные exact dossiers, которые ранее отсутствовали, уже опубликованы:
  - `genin-tarte-au-citron-canon`;
  - `herme-2000-feuilles-canon`;
- documentary Research Timeline;
- 16 bounded documentary milestones, покрывающих 15 works;
- permanent `LÉGENDE / DOCUMENT` interlude для Tatin;
- Technique Index;
- homepage gateway;
- collection previous/next/return navigation;
- responsive/reduced-motion/browser contracts;
- `CollectionPage + ItemList + BreadcrumbList`;
- `Article.isPartOf → /canon/`;
- image discovery / ImageObject provenance / truthful lastmod / post-deploy SEO proof.

## Исторические границы, которые нельзя размывать

- Paris-Brest: сохранять конфликт **1909–1910**, пока нет основания закрыть его новой первичкой.
- Opéra: не сливать older 1899 `gâteau opéra` name lead с Dalloyau 1955.
- Tatin: older inversion technique, documentary transmission и поздняя accident legend — разные слои.
- Acton: не объявлять «изобретателем» на основании ранней shell+lemon architecture.
- Bailleux: не back-project 1860 named-entry evidence в 1856.
- Saturnalia → modern galette: не публиковать как доказанную прямую линию.
- Не придумывать точные INPI/register particulars, если архивный объект не получен.

Product generated media и historical facsimile/evidence custody остаются разделены.

## Media authority

`src/data/canon-media.ts` — единственная media authority для exhibition pack.

`docs/le-canon-sucre/IMAGE_PROMPTS.md` остаётся production prompt bible для визуального DNA, но любые старые формулировки внутри него о том, что Genin/2000 Feuilles dossier «ещё не опубликован», считать историческим состоянием generation-wave: **оба dossier уже опубликованы и связаны с Canon**.

Не заменять dedicated Canon media случайными `public/images/articles/*` и не копировать Canon pack обратно в article library без отдельной editorial причины.

## SEO authority

Текущий Canon release должен сохранять:

- `max-image-preview:large` на indexable pages;
- 15 Canon `ImageObject` с реальными 1280×800, MIME, credit, creator и generated-media provenance;
- representative Canon `og:image` / preferred image;
- все 15 images в image sitemap через `image:loc`;
- article image sitemap discovery;
- truthful article `<lastmod>` из реального `dateModified`;
- отсутствие deprecated image sitemap tags;
- отсутствие keyword-template alt;
- visible disclosure generated editorial visualization там, где это применимо;
- IndexNow только post-deploy после live proof.

Общий актуальный стандарт для следующих разделов: `docs/PRODUCTION_SECTION_PLAYBOOK.md`.

## Что намеренно НЕ входит в закрытый scope

### Atlas Documentaire

Не добавлять классическую карту «происхождения десертов» как автоматическое продолжение Canon. Если Atlas появится, это отдельная Research/Product wave с типизированными связями:

- `MAISON`;
- `TRANSMISSION`;
- `INSTITUTION`;
- другие явно определённые связи.

`ORIGIN` — только если доказан отдельно.

### Historical facsimiles

Не публиковать facsimile/archive image только потому, что источник найден. Нужен item-level rights review и отдельная media custody.

### Массовые aspect-ratio derivatives

Не генерировать 15×3 или 157×3 версии только ради формального SEO checklist. Делать curated derivatives для flagship pages при реальной пользе Search/Discover/CWV и без потери композиции.

### Случайный эффект-polish

После accepted release не добавлять новые hover/3D/animation эффекты без новой Product-задачи. Это повышает regression risk и не делает закрытый Canon «более завершённым».

## Change policy после closeout

Любое новое существенное изменение относится к одной из трёх категорий и должно идти отдельной веткой/PR:

1. **Research correction** — новый сильный источник меняет bounded claim.
2. **Measured SEO/UX improvement** — есть данные Search Console/CWV/browser telemetry.
3. **New Product wave** — Atlas, новые works, новый narrative layer и т.п.

Нельзя тихо расширять текущий Canon scope под видом «полировки».

## Definition of closed

Текущий Le Canon Sucré считается полностью закрытым, потому что:

- [x] Research transfer завершён;
- [x] 15 media завершены;
- [x] 15 article bindings реальны;
- [x] UI/navigation/Technique Index завершены;
- [x] historical fail-closed boundaries встроены в Product;
- [x] SEO/image SEO hardened;
- [x] source/build/browser/visual gates прошли;
- [x] production merge выполнен;
- [x] live exact-SHA release proof выполнен;
- [x] temporary design authority удалена;
- [x] дальнейшие идеи отделены от текущего scope.

**Итог:** Canon не имеет незакрытого Product-долга. Следующая работа начинается только как новая измеримая или редакционно обоснованная волна.
