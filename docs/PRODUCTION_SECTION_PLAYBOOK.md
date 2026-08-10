# Production Section Playbook — 2026

Короткий постоянный стандарт для любого нового крупного раздела сайта. Он собран из практического опыта **Le Canon Sucré**: что сработало, где возникали риски и какие проверки должны существовать до merge.

**Дата сверки SEO-правил:** 2026-08-10. Для спорных или меняющихся требований сначала сверяться с официальной документацией Google Search Central, W3C/WAI и IndexNow; не переносить старые SEO-блоги в код как стандарт.

## 1. Начинать с модели, не с интерфейса

До hero, анимаций и карточек должны быть зафиксированы:

- точный список объектов и стабильные IDs;
- какие страницы уже существуют, а какие действительно нужно публиковать;
- типы утверждений: документировано / конфликт источников / легенда / редакционная интерпретация;
- source trail и границы допустимой формулировки;
- отдельный media registry;
- structured-data модель раздела;
- permanent audit, который запретит неполный или противоречивый release.

**Не создавать fake routes, placeholder history или origin-claims ради красивой навигации.** Если evidence не позволяет утверждение — Product должен быть fail-closed.

## 2. Разделять authority-слои

Новый раздел лучше строить как независимые слои:

```text
section-data        → состав, порядок, labels, relationships
section-library     → реальные article bindings
section-media       → dedicated media identity / alt / dimensions / provenance
section-research    → документальные claims, dates, conflicts, source trail
section-techniques  → отдельная relation model, если нужна
```

Практический урок Canon: изображение, исторический факт и article route не должны автоматически создавать друг друга.

## 3. Research: правило fail-closed

Для исторических/авторских утверждений:

- сохранять конфликт дат как конфликт, а не выбирать удобную дату без основания;
- отделять первое найденное употребление названия от доказанного происхождения объекта;
- позднюю легенду маркировать как легенду;
- не превращать передачу техники, институциональную связь или место популяризации в `ORIGIN`;
- не публиковать archive/facsimile media без item-level rights review;
- не переносить исследовательскую гипотезу в Product как установленный факт;
- при отсутствии точного первичного объекта формулировать границы знания явно.

Для будущих карт/атласов использовать типы связи вроде `MAISON / TRANSMISSION / INSTITUTION`; `ORIGIN` допустим только при действительно достаточном evidence.

## 4. Media и Image SEO

### Production media contract

- описательное стабильное имя файла, связанное с entity/ID;
- для ключевых discovery images — качественный landscape master не уже **1200 px**; критические детали держать crop-safe;
- semantic/content images публиковать через обычный HTML `<img src>` или `<picture>` с fallback `src`, не только CSS background;
- реальные `width`/`height` в markup;
- informative image → краткий contextual `alt`; purely decorative image → `alt=""`;
- не делать keyword stuffing в alt/filename/caption;
- representative page image указывать через `og:image` и, где уместно, `primaryImageOfPage` / main entity `image`;
- crawlable images добавлять в image sitemap через поддерживаемый `image:loc`;
- generated editorial media маркировать честным provenance; structured data или embedded IPTC достаточно, а два конфликтующих источника metadata хуже одного согласованного.

Google сейчас рекомендует для Discover compelling images от 1200 px, более 300k пикселей и landscape/16:9-friendly композицию с `max-image-preview:large`. Это рекомендация для отбора/preview, а не основание автоматически растягивать каждую картинку в 16:9. Делать отдельные 16:9 / 4:3 / 1:1 derivatives стоит для важных страниц, если они художественно корректны и/или данные Search Console показывают пользу.

Официальные источники:

- Google Images SEO: https://developers.google.com/search/docs/appearance/google-images
- Google Discover: https://developers.google.com/search/docs/appearance/google-discover
- Google Article structured data: https://developers.google.com/search/docs/appearance/structured-data/article
- Google image metadata: https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata
- W3C/WAI Images Tutorial: https://www.w3.org/WAI/tutorials/images/

## 5. SEO baseline нового раздела

Каждая indexable landing/article page должна иметь:

- crawlable URL и обычные internal links;
- один честный canonical;
- уникальный, descriptive и concise `<title>`;
- полезный page-specific meta description;
- один визуально ясный основной H1;
- `robots` без случайного `noindex`; для крупных preview — `max-image-preview:large`;
- representative OG/Twitter image;
- structured data, которая **точно соответствует видимому content**;
- sitemap membership для canonical URL;
- `<lastmod>` только при известной дате **значимого** изменения страницы.

### Не делать

- `meta keywords`;
- повторение ключей в title/alt;
- фальшивые ratings/license/copyright/author/origin;
- `changefreq` и `priority` как «SEO-сигналы» — Google их игнорирует;
- synthetic build-time `lastmod`;
- schema type «на всякий случай»;
- отдельные `AEO/GEO/AI-schema` hacks: Google в 2026 прямо указывает, что для AI Overviews/AI Mode дополнительных технических требований или специальной schema не требуется.

Google не задаёт фиксированного лимита символов для `<title>`; presentation может быть обрезана под устройство. Любой внутренний лимит title/description — house style, не поисковый стандарт.

### Structured data

- main schema type должен отражать главную сущность/назначение страницы;
- `Recipe` — только для полноценного видимого рецепта с реальными ingredients/instructions;
- structured data не должна описывать скрытый или отсутствующий content;
- FAQ markup не считать SEO-бонусом для этого проекта: Google регулярно показывает FAQ rich results в основном well-known authoritative government/health sites; наличие корректного FAQPage само по себе не даёт здесь видимого rich result.

Официальные источники:

- Search Essentials: https://developers.google.com/search/docs/essentials
- Title links: https://developers.google.com/search/docs/appearance/title-link
- Structured data guidelines: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- AI features and website: https://developers.google.com/search/docs/appearance/ai-features
- FAQ change: https://developers.google.com/search/blog/2023/08/howto-faq-changes

## 6. Sitemap, discovery и indexing

- sitemap содержит preferred canonical URLs;
- image discovery — `image:image > image:loc`;
- `lastmod` отражает последнее значимое изменение content/structured data/links, а не время сборки;
- `priority` и `changefreq` не добавлять;
- Google: sitemap/Search Console являются discovery mechanisms; sitemap — hint, а не гарантия индексации;
- IndexNow: отправлять только added/updated/deleted URLs после успешного live deploy; root key должен доказывать ownership; один POST — не более 10,000 URLs.

Официальные источники:

- Google sitemap: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- IndexNow protocol: https://www.indexnow.org/documentation

## 7. UX/accessibility gates

До release проверить минимум:

- desktop, mobile, tablet;
- touch без hover-only обязательной информации;
- keyboard/focus и настоящие ссылки;
- reduced-motion;
- safe-area / floating controls non-overlap;
- отсутствие horizontal overflow;
- контраст microtype;
- stateful interactions после navigation/scroll;
- no JS console/page errors;
- semantic landmark contract.

Не заменять настоящую ссылку `<a href>` кликабельным `div/button`, если это навигация: это ухудшает и UX, и crawlability.

## 8. Permanent QA вместо ручной памяти

Новый раздел считается production-quality только если критические договорённости зашиты в тесты:

- exact ID-set / media-set / route-set equality вместо magic counts;
- duplicate/missing bindings fail build;
- generated HTML contract;
- structured-data contract;
- sitemap/image discovery contract;
- browser/responsive visual contract;
- repository hygiene;
- exact-SHA release proof после deploy.

Временный design/research authority-файл допустим во время большой волны, но в closeout должен быть либо удалён, либо превращён в короткий постоянный документ. Не оставлять `_TEMP_*` как скрытую вторую систему правды.

## 9. Рекомендуемая последовательность release

```text
Research
→ bounded claims / source trail
→ Product data model
→ real article routes
→ dedicated media registry
→ UI/interaction
→ structured data + sitemap
→ source/build audits
→ browser/responsive QA
→ immutable exact-head release candidate
→ merge
→ deploy
→ live exact-SHA proof
→ IndexNow / Search Console observation
```

Не продолжать менять head после того, как exact-head evidence уже принят. Если development branch продолжает двигаться, вырезать immutable release lane из проверенного SHA.

## 10. Что показал Canon: анти-паттерны

- UI раньше evidence → красивые, но опасные origin-claims.
- Generic/legacy image reuse → entity mismatch.
- Наличие media принимается за наличие route → broken editorial architecture.
- Hard-coded corpus count → тесты ломаются при легитимном расширении.
- Проверка source вместо generated artifact → production divergence остаётся незамеченной.
- Green CI без live SHA witness → неизвестно, что реально обслуживает домен.
- Post-build переписывание HTML → лишняя нестабильность; исправлять root cause в source/build pipeline.
- «Больше schema = лучше SEO» → неверно; schema обязана быть релевантной и соответствовать видимому content.
- Бесконечный эффект-polish после принятого release → растущий regression risk без измеримой ценности.

## 11. Definition of Done для нового отдела

Раздел можно закрывать, когда одновременно выполнено:

- [ ] scope конечный и документирован;
- [ ] все entities имеют реальные IDs и publication state;
- [ ] claims имеют source trail и fail-closed wording;
- [ ] media identity/rights/provenance определены;
- [ ] нет placeholder/fake routes;
- [ ] generated pages имеют title/description/canonical/H1/representative image;
- [ ] structured data совпадает с visible content;
- [ ] sitemap и truthful lastmod корректны;
- [ ] permanent source/build/browser/SEO gates зелёные;
- [ ] visual evidence просмотрен человеком;
- [ ] exact released SHA подтверждён live;
- [ ] temporary authority удалена;
- [ ] дальнейшие идеи вынесены в отдельную будущую волну, а не считаются «незакрытым долгом» текущего scope.

После этого Product не нужно механически «дополировывать». Следующая SEO/UX волна должна опираться на реальные Search Console/CWV/user data или на новую редакционную задачу.
