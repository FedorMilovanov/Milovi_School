# Patisserie Russe — Astro SSG

**french.milovicake.ru** — статическая редакционная библиотека о французской кондитерской школе.

Текущее production-состояние после закрытия **Le Canon Sucré**: основная библиотека содержит **157 опубликованных статей**, отдельную визуальную галерею `/materials/` и кураторский раздел `/canon/` с 15 объектами, 15 dedicated media assets и 15 реальными article routes. Проверки корпуса должны опираться на реальные ID/наборы данных, а не на жёстко зашитое число статей.

## Быстрый старт

Требуется Node.js **22.13.0+** и npm **10.9.2+**.

```bash
npm ci
npm run dev
npm run build
npm run validate
```

`npm run validate` — основной локальный release gate: TypeScript, lint, content/editorial/security checks, production build, raw-build audit, site/Canon/Research/SEO audits и privacy contract.

## Production-архитектура

```text
/                         → главная
/materials/                → визуальная галерея библиотеки
/canon/                    → Le Canon Sucré, отдельная CollectionPage
/articles/<id>/            → статические article pages
```

Ключевые принципы:

- Astro SSG выдаёт готовый индексируемый HTML; тяжёлый article content остаётся build-time.
- Client islands получают только browser-safe metadata, без полного корпуса текстов.
- Навигация по статьям остаётся native MPA; `ClientRouter` / View Transitions не возвращать без отдельного доказанного решения причины прежних зависаний.
- Dark theme — основной фирменный режим; существующие protected design decisions не «упрощать» автоматически.
- Исторические утверждения, editorial media и article routing — разные слои данных. Наличие изображения не создаёт исторический факт или article route.

Подробные инженерные ограничения для агентов: [`AGENTS.md`](./AGENTS.md).

## Le Canon Sucré

`/canon/` — не категория и не декоративный лендинг, а отдельная кураторская коллекция.

Текущая граница продукта:

- 15/15 Canon works;
- 15/15 WebP assets в `public/images/canon-sucre/`;
- 15/15 реальных article bindings;
- documentary Research Timeline с fail-closed формулировками;
- `LÉGENDE / DOCUMENT` для отделения поздней легенды Tatin от документальной линии;
- Technique Index;
- `CollectionPage` / `ItemList` / `BreadcrumbList` и `Article.isPartOf`;
- отдельные browser/responsive/Research/media quality gates.

Финальный статус и границы дальнейших изменений: [`docs/le-canon-sucre/CLOSEOUT.md`](./docs/le-canon-sucre/CLOSEOUT.md).

Промты и визуальный production-контракт Canon: [`docs/le-canon-sucre/IMAGE_PROMPTS.md`](./docs/le-canon-sucre/IMAGE_PROMPTS.md).

## SEO / Search 2026

Текущий SEO-контур проверяется не вручную, а fail-closed аудитами generated site и post-deploy live proof.

Базовые обязательные свойства:

- уникальные `<title>` и полезные meta descriptions;
- canonical URL и crawlable internal `<a href>` links;
- `robots` для indexable pages разрешает `max-image-preview:large`;
- Open Graph / Twitter large-image metadata;
- `Article` JSON-LD только с данными, соответствующими видимому контенту;
- `Recipe` schema только для настоящих полноценных рецептов;
- `ImageObject` с реальными размерами, caption/name/credit и честным provenance для generated editorial media;
- современный image sitemap (`image:loc`) и правдивый `<lastmod>` только для значимых изменений;
- Canon images включены в image discovery и имеют representative preferred-image signals;
- IndexNow уведомляется только после подтверждённого live deploy;
- никаких `meta keywords`, keyword-stuffed alt, fake license/copyright, `priority`, `changefreq` или «AI/GEO schema hacks».

Важно: фиксированный лимит символов для Google title/snippet не является стандартом. Заголовки и описания должны быть прежде всего точными, отличимыми и полезными; поисковик может переписывать/обрезать presentation. Существующие внутренние длины — редакционный house style, а не обещание Google.

Актуальный стандарт для новых разделов, включая image SEO, structured data, Research boundaries, release gates и правила обновления требований: [`docs/PRODUCTION_SECTION_PLAYBOOK.md`](./docs/PRODUCTION_SECTION_PLAYBOOK.md).

## Добавление статей

1. Добавить metadata/content через canonical data layer проекта.
2. Не импортировать полный corpus content в client islands.
3. Указать честные source/date/image metadata.
4. Использовать Recipe/FAQ/другие schema types только когда они точно соответствуют видимому содержимому и актуальной поддержке поисковиков.
5. Выполнить `npm run validate`.
6. Для изменений production-поверхности дополнительно дождаться browser/release-proof workflows на точном SHA.

## Новый крупный раздел

Не начинать с эффектов или layout. Сначала зафиксировать:

1. границы корпуса и IDs;
2. типы утверждений и Research source trail;
3. реальные routes;
4. отдельный media registry и права/provenance;
5. structured-data модель;
6. permanent audits;
7. только затем визуальный слой и interaction polish.

Полная последовательность и checklist: [`docs/PRODUCTION_SECTION_PLAYBOOK.md`](./docs/PRODUCTION_SECTION_PLAYBOOK.md).

## Деплой

Push/merge в `main` проходит GitHub Actions и immutable release proof. Live release считается подтверждённым только когда production witness соответствует exact deployed SHA; зелёный build без live proof не является достаточным доказательством публикации.

## Документация

- [`AGENTS.md`](./AGENTS.md) — protected engineering/design rules.
- [`docs/PRODUCTION_SECTION_PLAYBOOK.md`](./docs/PRODUCTION_SECTION_PLAYBOOK.md) — стандарт новых крупных разделов и SEO/release checklist.
- [`docs/le-canon-sucre/CLOSEOUT.md`](./docs/le-canon-sucre/CLOSEOUT.md) — финальный контракт закрытого Canon scope.
- [`docs/le-canon-sucre/IMAGE_PROMPTS.md`](./docs/le-canon-sucre/IMAGE_PROMPTS.md) — Canon image production brief.

Исторические changelog-детали остаются в Git/PR history. README описывает только текущую production-authority и не должен превращаться в архив старых цифр и временных решений.
