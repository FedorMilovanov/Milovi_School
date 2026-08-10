# AGENTS.md — Milovi School / Patisserie Russe

> **Обязателен к прочтению до любого изменения проекта.**
>
> Production: **https://french.milovicake.ru**  
> Stack: **Astro 7 SSG + React 18 + TypeScript strict + Tailwind 4**  
> Updated: **2026-08-10**

Этот файл содержит protected engineering/product rules. Детальный стандарт для новых крупных разделов и актуальный SEO/release checklist: [`docs/PRODUCTION_SECTION_PLAYBOOK.md`](./docs/PRODUCTION_SECTION_PLAYBOOK.md).

## 0. Нельзя делать без отдельной причины и проверки

1. Не создавать source-файлы React/Astro/TS/CSS вне `src/`.
2. Не менять `astro.config.mjs`, `tsconfig.json`, `eslint.config.js` или dependency versions «для удобства».
3. Не импортировать полный article corpus/deep content в client islands.
4. Не обращаться к `window`, `document`, `localStorage` в SSR/build path без browser guard/helper.
5. Не удалять Service Worker build-hash/caching safeguards.
6. Не менять dark-first visual identity автоматически.
7. Не возвращать Astro `ClientRouter` / View Transitions без отдельного доказанного решения прежней navigation regression.
8. Не возвращать длинный полный список материалов на главную: `/materials/` — отдельная галерея.
9. Не заменять navigation links на clickable `div`/`button`, если семантика — переход по URL.
10. Не делать post-build переписывание generated HTML для исправления source/build проблемы.
11. Не добавлять fake routes, fake claims, fake schema, fake ratings/license/copyright.
12. Не расширять закрытый `Le Canon Sucré` под видом случайной «полировки».
13. После изменения — запускать соответствующие permanent gates; перед release — `npm run validate`.

## 1. Текущее устройство сайта

```text
/                         → homepage
/materials/                → visual library gallery
/canon/                    → Le Canon Sucré CollectionPage
/articles/<id>/            → static article pages
/privacy/ и policy pages   → static documents
```

После Canon closeout опубликовано **157 article routes**. Это snapshot, а не magic constant: проверки нового кода должны сравнивать реальные ID sets / bindings, а не падать только потому, что корпус легитимно вырос.

### Data flow

```text
build-time article corpus
  → library/build data
  → Astro page generation
  → static HTML

browser
  → light client metadata only
  → React islands / search / interactions
```

Полный content не должен попадать в browser bundle ради поиска, карточек или навигации.

## 2. Protected architecture

### 2.1 Client islands

Client components импортируют только browser-safe metadata/types. Если объект содержит полный article body или большой research corpus, он должен оставаться build-time до тех пор, пока нет измеренной причины отправлять его клиенту.

### 2.2 Browser APIs

Любой browser-only доступ должен быть SSR-safe:

```ts
if (typeof window !== 'undefined') {
  // browser-only work
}
```

Предпочитать существующие helpers проекта для storage/state, а не размножать прямые вызовы.

### 2.3 Navigation

Article/navigation URLs должны оставаться настоящими `<a href>`.

Native MPA navigation — текущая production authority. `ClientRouter` уже вызывал зависания при переходах с тяжёлой главной; не возвращать его как «modernization» без отдельного regression-proof.

### 2.4 Generated HTML

Исправлять root cause в source/SSR/build pipeline. Не добавлять скрипт, который после `astro build` массово переписывает HTML ради сокрытия дефекта исходной сборки.

Raw generated artifact и deployed artifact должны быть проверяемыми и предсказуемыми.

### 2.5 Service Worker

`public/sw.js` и build-hash/version wiring являются частью update/caching contract. Не удалять hash placeholder/version logic и cache trimming без полного browser/update audit.

## 3. Protected product/design decisions

### Dark-first

Dark theme — основной фирменный опыт, а не случайный default. Light theme поддерживается, но нельзя автоматически «осветлять» сайт как улучшение.

### Homepage / Materials

- Главная не должна снова превращаться в длинный каталог всех статей.
- `/materials/` остаётся отдельной visual gallery.
- Существующие premium hover/reference behaviours не упрощать без визуального сравнения и запроса владельца.
- Touch/keyboard experience не должен зависеть от hover-only disclosure.

### Le Canon Sucré

`/canon/` — отдельная curated collection, не обычная category.

Current closed scope:

- 15 Canon works;
- 15 dedicated WebP;
- 15 real article bindings;
- documentary Research Timeline;
- Tatin `LÉGENDE / DOCUMENT` boundary;
- Technique Index;
- collection navigation;
- Canon/Research/browser/SEO permanent gates.

Final contract: [`docs/le-canon-sucre/CLOSEOUT.md`](./docs/le-canon-sucre/CLOSEOUT.md).

**Не считать новым долгом** Atlas, дополнительные effects, historical facsimiles или массовые image derivatives. Это отдельные будущие waves только при новой редакционной/измеримой причине.

## 4. Research / editorial truth rules

Для historical/editorial sections:

- конфликт источников публикуется как конфликт;
- легенда не повышается до documented fact;
- transmission/popularization/institution не переименовываются в `ORIGIN`;
- отсутствие evidence не заполняется правдоподобным вымыслом;
- source ≠ author;
- generated editorial image ≠ historical evidence;
- archive/facsimile publication требует rights review;
- Product wording должен быть fail-closed.

Если новый сильный источник меняет claim, это отдельная Research correction с обновлением тестов/документов.

## 5. Media rules

Для dedicated section media:

- отдельный media registry — source of truth;
- descriptive stable filenames/IDs;
- реальные dimensions/format;
- semantic image через `<img src>`/`<picture>` с fallback `src`, а не только CSS background;
- informative image — краткий contextual alt;
- decorative image — `alt=""`;
- без keyword stuffing;
- representative page image согласовать с OG/structured data;
- generated editorial media маркировать честным provenance, когда это известно.

Canon-specific prompt/media contract: [`docs/le-canon-sucre/IMAGE_PROMPTS.md`](./docs/le-canon-sucre/IMAGE_PROMPTS.md).

## 6. SEO 2026 — permanent principles

SEO требования меняются. Перед новым крупным SEO pass сверяться с **официальной** Search Central/W3C/IndexNow документацией, а не с памятью агента или SEO-блогами.

Текущие production rules:

- indexable page: title, useful description, canonical, H1, crawlable links;
- large previews разрешены через `max-image-preview:large`;
- representative `og:image` / image alt;
- Article/ImageObject/Collection structured data соответствуют visible content;
- Recipe schema — только настоящий полноценный recipe content;
- image sitemap использует актуальный `image:loc`;
- sitemap `lastmod` — только реальная дата значимого изменения;
- не использовать `priority`/`changefreq` как Google ranking/indexing signals;
- не добавлять `meta keywords` или keyword-stuffed alt/title;
- не придумывать AI/GEO/AEO-specific schema: Google не требует специальной разметки для AI Overviews/AI Mode;
- IndexNow notification выполняется только после успешного live deploy proof.

Внутренние ограничения длины title/description — house style, не «лимит Google».

Детали и официальные ссылки: [`docs/PRODUCTION_SECTION_PLAYBOOK.md`](./docs/PRODUCTION_SECTION_PLAYBOOK.md).

## 7. Новый крупный раздел: обязательный порядок

Не начинать с UI.

```text
1. exact scope / IDs
2. Research claims + source trail
3. real publication/routes model
4. media identity + provenance/rights
5. structured-data model
6. permanent source/build contracts
7. UI / interactions
8. generated-site SEO audit
9. browser/responsive/reduced-motion QA
10. immutable exact-head release candidate
11. merge + deploy
12. live exact-SHA proof
```

Если development branch продолжает двигаться после принятого visual/evidence SHA, релиз вырезать из проверенного immutable commit, а не считать новый head автоматически эквивалентным.

## 8. Temporary authority lifecycle

В большой design/research wave допустим `_TEMP_*` authority, если он помогает синхронизировать работу. В closeout он обязан:

- либо исчезнуть;
- либо быть преобразован в короткий permanent doc;
- а критические правила должны жить в code/tests, не только в Markdown.

Не оставлять временный файл как скрытую вторую систему правды.

## 9. Validation

Основная локальная проверка:

```bash
npm ci
npm run validate
```

`validate` включает TypeScript, lint, content/editorial/security checks, build, raw build audit, site/Canon/Research/SEO audits и privacy contract.

Для UI/section release дополнительно обязательны соответствующие browser/visual workflows. Для production-closeout доказательство — не только green build, а **exact deployed SHA live witness**.

## 10. Repository hygiene

Запрещено коммитить:

- локальные архивы/evidence ZIP как source;
- temporary payload/patch scripts после завершения переноса;
- build output/cache;
- duplicate source files в корне;
- reference dumps, которые не являются permanent docs;
- секреты/токены.

История решений хранится в Git/PR. README и AGENTS должны описывать текущую authority, а не накапливать бесконечный changelog старых состояний.

## 11. Definition of Done

Изменение/раздел можно считать закрытым только когда:

- scope и границы утверждений определены;
- real routes/media/data согласованы;
- no placeholders/fake claims;
- generated artifact проходит permanent audits;
- accessibility/responsive/browser checks зелёные;
- SEO/schema соответствует visible content и актуальным правилам;
- temporary authority удалена;
- exact release SHA подтверждён на live domain;
- новые идеи вынесены в отдельную будущую wave.

После этого не добавлять случайные изменения только ради ощущения «ещё чуть-чуть дополировать».
