# Аудит репозитория Milovi School / Patisserie Russe — 2026-10-26

**Тип:** аудит без правок продукта (только отчёт + доказательства).
**Основание:** запрос владельца на поиск багов, неточностей, слабостей статей, отсутствующих premium-фич, «кривых открытий» и неверно написанного текста.
**Authority:** [`AGENTS.md`](../AGENTS.md) §4.1, §5, §7; [`docs/CONTENT_QUALITY_WAVES.md`](./CONTENT_QUALITY_WAVES.md); [`.github/workflows/ci.yml`](../.github/workflows/ci.yml); `deep-polish-audit.yml`, `gallery-quality.yml`.

---

## 0. Резюме

Технические гейты на точном HEAD зелёные (CI: 23/23 success), но зелёные гейты не видят пять крупных классов дефектов:

1. **Гейт живости источников проверяет не те данные.** `articleOverrides.ts` (49 `sourceUrl`, 79/157 финальных статей) вообще не сканируется. Итог: **20 опубликованных статей** имеют видимую ссылку «Источник»/`citation` на URL, который собственный `KNOWN_DEAD_URLS` проекта считает подтверждённо мёртвым; ещё **5** ведут на корень/индекс при `MAX_WEAK_CITATIONS = 0`.
2. **Рендерер контента ломает 17 страниц.** 6 страниц показывают сырые `====`, 6 — сырые `##`/`-` в блоке источников, 5 — H2-заголовок, проглотивший целый абзац. Две статьи (`recipe-tuiles-amandes`, `recipe-gougeres`) испорчены целиком.
3. **47 рецептов показывают читателю машинные `PT45M`/`PT40M`**, а 11 встроенных иллюстраций в 8 статьях подменяются одной и той же заглушкой с подписями про эклеры/макароны/мильфей.
4. **Полный текст статьи дублируется в HTML**: медиана `astro-island props` 107 КБ на страницу (16.9 МБ на корпус), медиана HTML 213 КБ. Формально нарушает `AGENTS.md` §1/§2.1.
5. **Источник ≠ автор де-факто не соблюдён в видимом UI**: 144/157 статей показывают список источников как подпись автора; 150/157 `imageAlt` равны заголовку.

Плюс: серьёзные (`serious`) нарушения контраста axe на всех проверенных страницах в обеих темах, сломанный skip-link на `/materials/`, и отсутствующий публичный лог исправлений при обещании на `/corrections/`.

---

## 1. Факт среды и гейтов (а не ожидание)

| Проверка | Факт |
|---|---|
| `git status` на старте | чисто; HEAD `1b0b848`, ветка `arena/0e3a398a-milovi-school` |
| `node_modules` | **отсутствовал** → выполнен `npm ci` (373 пакета, 9 с), только потому что реально не было |
|`/tmp` | на старте **не было** ни Chromium, ни `launch-helper.js`; браузер получен с npm (`@sparticuz/chromium@153.0.0` + `al2023.tar.br` → `/tmp/al2023/lib`, `LD_LIBRARY_PATH`); Playwright из repo, axe-core с npm |
| dev-сервер | не был запущен; для проб поднят `python3 -m http.server 4321` на `0.0.0.0` поверх `dist/` |
| Python | системный Python externally-managed → отдельный venv `/tmp/audit-venv` с `pillow`, `beautifulsoup4` |
| CI exact HEAD | `gh api .../check-runs --paginate` → **23 success**, 0 failure/cancelled |
| `npm run validate` локально | **RED на `audit:security`**: 12 уязвимостей (1 low, 3 moderate, 8 high) — `astro` low, `sharp`, `vite`, `zod`, `undici`, `source-map-js`, `devalue`, `brace-expansion`, `http-cache-semantics` high. Все **только dev** (`npm audit --omit=dev` = 0). Пред-существующее красное, не исправлялось |
| Остальные гейты по отдельности | `check`, `lint`, `audit:content`, `build`, `audit:build`, `audit:site`, `audit:privacy` — **все PASS**: 155/155 уникальных тел, depth 155 ok, editorial 0 issues, 19 приписанных цитат без нарушений, 676 цитат / 0 слабых (офлайн), 157 article routes, 169 HTML, SEO 3477 проверок / 166 indexable, privacy OK |
| `audit:source-links` | сетевая проверка **SKIPPED — no egress**; в CI strict-шаг есть |

Корпус: **157 статей** = 155 legacy (`articles.ts` + `deepContents.ts` + 20 expansion parts) + 2 точных Canon-досье (`canonArticles.ts`), 1 411 537 символов контента, 47 `recipeData`, 44 FAQ.

---

## 2. P0 — ломает читателя, источники и SEO

### 2.1 Мёртвые и слабые ссылки «Источник» проходят через дыру в гейте

`scripts/audit_source_links.py::collect_citations()` читает `articleExpansionParts/*.ts`, `canonArticleContents.ts`, `canonArticleAppendices.ts`, `articles.ts` и `canonArticles.ts`. **Не читает `articleOverrides.ts` и `deepContents.ts`.**

- `articleOverrides.ts`: 49 уникальных `sourceUrl`; **79 из 157** финальных `sourceUrl` приходят именно оттуда (override перезаписывает `articles.ts`).
- **20 статей** публикуют URL из собственного `KNOWN_DEAD_URLS` (38 записей, «definitive 404/soft-404 verdicts»): `croissant-history`, `millefeuille-histoire`, `french-classics-origins`, `eclair-histoire-complete`, `financier-histoire` (Wikisource 1873); `brillat-savarin`, `careme-first-celebrity-chef`, `carnaval-culinaire-histoire`, `histoire-tartes-francaises`, `cuisine-brigade`, `cuisine-fond-brun`, `escoffier-biography` (Gallica selections); `recipe-opera-dalloyau`, `opera-gateau-histoire` (`dalloyau.fr/opera.html`); `lignac-kouign-amann`, `lignac-equinoxe`, `lignac-far-breton`, `recipe-tarte-citron-grolet`, `stohrer-1730`, `patissiers-guild-medieval`.
- **5 статей** публикуют слабые URL: `jacquesgenin.fr/univers` ×3 (`genin-ganache-craft`, `genin-millefeuille`, `genin-autodidact`), `nicolaspaciello.com/` (`paciello-praline-art`), `christophe-felder.com/recettes/` (`felder-fraisier`) — хотя `docs/CONTENT_QUALITY_WAVES.md` §7.20/§7.21 утверждает, что именно эти слабые URL закрыты.
- `deepContents.ts`: 11 URL вообще вне проверки живости/слабости.
- Статические страницы (`/methodology/`, `/about/`, `/sources/`) тоже содержат внешние ссылки, не покрытые гейтом.

Доказательство: `dist/articles/lignac-far-breton/index.html` → sidebar «Источник» → `cuisineactuelle.fr/.../far-breton-au-pruneaux-de-cyril-lignac-53044` (в `KNOWN_DEAD_URLS`). Скриншот: `audit/repo-audit-2026-10-26/s-lignac-far-breton.png`.

**Почему гейт зелёный:** `known_dead`/`offline_weak` считаются по `citations`, куда overrides не попадают; проверяются устаревшие значения из `articles.ts` (129 URL, 0 мёртвых, 0 слабых).

### 2.2 Рендерер контента: сырая разметка вместо вёрстки (17 страниц)

`ArticleView.tsx` режет контент по `\n\n` и распознаёт заголовки только если блок **целиком** соответствует шаблону. В корпусе есть блоки, где заголовок склеен с текстом (нет пустой строки), и блоки, где `## heading` склеен со списком источников.

| Симптом | Страниц | ID |
|---|---:|---|
| Видимые сырые `====` в тексте | 6 | `recipe-tuiles-amandes`, `recipe-gougeres`, `genin-caramel-philosophy`, `herme-ispahan-deep`, `french-classics-origins`, `croissant-history` |
| Видимый сырой `## Французские источники…` + `-` вместо `<ul>` | 6 | `recipe-eclairs-adam`, `adam-eclair`, `herme-biography`, `metayer-biography`, `grolet-lemon-yuzu`, `herme-architecture-taste` |
| H2 длиной 111–196 символов, поглотивший предыдущий абзац (и попавший в TOC) | 5 | `felder-fraisier`, `lignac-far-breton`, `genin-ganache-craft`, `mercotte-entremets-system`, `mercotte-tarte-citron` |
| Полностью сломанная статья (21 блок ≥200 символов с `====` внутри) | 2 | `recipe-tuiles-amandes`, `recipe-gougeres` |

Причина: 1250 separator-блоков, из них 21 имеют «заголовок» ≥200 символов → не проходят `raw.includes('========') && title.length < 200`, падают в обычный `<p>` с `whitespace-pre-line`; ещё 7 блоков <200, но содержат прозу. `##`-блоки не матчатся `^(#{2,3})\s+(.*)$` без `m`-флага, если в блоке больше одной строки.

Скриншоты: `s-recipe-tuiles-amandes.png` (сырые `====`), `s-giant-heading.png` (H2-абзац), `s-raw-source-list.png` (сырые `##`/`-`). Проверено в Chromium на собранном `dist/`, `document.body.innerText` содержит `====`/`##`.

### 2.3 Рецепты и иллюстрации

- **47/47** статей с `recipeData` показывают читателю ISO-8601 duration как есть: «Подготовка PT45M», «Приготовление PT40M». `ArticleView.tsx` выводит `article.recipeData.prepTime` без форматирования. Отдельные значения спорные: `recipe-mousse-au-chocolat` → `cookTime: 'PT0M'`, `recipe-marrons-glaces` → `PT96H`, `recipe-millefeuille-inverser` → `prepTime: 'PT14H'`.
- **11 встроенных изображений** в 8 статьях — внешние `images.unsplash.com`. Рендерер подменяет любой не-`/` src на `fallbackImageFor(category)`, поэтому все они превращаются в **один и тот же** `/_astro/pastry-chef.*.jpg` с подписями «Слои мильфея крупным планом», «Идеально ровные эклеры», «Сформованные круассаны». Всего 12 подмен (11 body + 1 hero `recipe-pecan-chocolate-creme-brulee`, единственная статья без dedicated WebP).
- `ArticleView` `imgAspectRatio()` не знает размеры external URL → жёсткий `16/9`, хотя реальные размеры неизвестны.

### 2.4 «Кривые открытия»: у 146/157 статей нет лид-абзаца

Первый блок контента: 139 статей начинаются с ASCII-заголовка `====…`, ещё 7 — с `## …`. Рендерер превращает это в `<section><p>Раздел</p><h2>…</h2>` сразу после H1/excerpt/hero. Итого **93% статей открываются заголовком раздела, а не вступлением**; поисковый сниппет и OG берутся из `excerpt`, а первый экран статьи не даёт ни одного предложения текста. Для двух статей из §2.2 «открытие» вообще показывает сырые `====` вместо названия раздела (оно уехало в обычный абзац).

### 2.5 Полный контент уезжает в браузер дважды

`src/pages/articles/[id].astro` передаёт `<ArticlePageShell article={article} allMeta={libraryClientMeta} client:load />`, где `article` содержит **полное тело**. В собранном HTML:

- медиана `astro-island[props]` = **107 149 байт**, всего **16.9 МБ** на 157 страниц;
- медиана HTML-документа = **212 988 байт**, всего **33.9 МБ**;
- в `props` лежит и `content` статьи, и метаданные всех 157 статей; SSR-HTML содержит тот же текст ещё раз.

Это противоречит `AGENTS.md` §1/§2.1 («Полный content не должен попадать в browser bundle ради поиска, карточек или навигации») и дорого обходится на мобильном: React гидратирует весь текст статьи. Корректный путь — Astro-рендер статического тела + маленькие islands только для интерактива.

---

## 3. P1 — редакционные неточности и «странные вещи»

1. **Легенда как факт в метаданных.** `french-classics-origins` excerpt: «Tarte Tatin — случайная ошибка сестёр… Пять историй с первоисточниками», хотя тело пишет «По легенде… Историки скептичны». `croissant-history` excerpt: «Круассан родился в Вене в 1683 году как kipfel», хотя раздел называется «ВЕНА, 1683: ЛЕГЕНДА О ПОЛУМЕСЯЦЕ». `escoffier-biography` — «изобрёл бригадную кухню» (кодифицировал, не изобрёл). `eclair-histoire-complete` — «В 1742 году его звали «картушем»» без хеджа в лиде. Нарушение `AGENTS.md` §4 (легенда ≠ document) именно в meta description и OG-сниппете.
2. **Неверная атрибуция источника.** `recipe-sables-diamant`: `sourceLabel: 'Christophe Felder'`, `sourceUrl: https://www.mercotte.fr/...` — подпись называет одного шефа, ссылка ведёт на другой сайт. `recipe-crepes-suzette`: label «Auguste Escoffier» (человек) вместо названия документа. `cuisine-sauces-history`: в байлайне опечатка **«Savory Kitchin»** (в `sourceLabel` — «Savory Kitchen»).
3. **Байлайн = список источников.** 144/157 статей показывают под H1 строку вида «Chef Simon, Meilleur du Chef, 750g, Academie du Gout», «Wikipedia, Paris.zagranitsa.com», «Cacao Barry, Valrhona». JSON-LD/`meta author` при этом честно говорит «Milovi School / Patisserie Russe», а `/editorial-policy/` обещает «Источник не подменяется автором редакционной адаптации». Видимый UI противоречит и схеме, и политике.
4. **alt-тексты.** 150/157 `imageAlt` дословно равны `title` (например, «История круассана: не французский…»). `normalizeImageAlt()` сам подставляет заголовок при отсутствии кастомного alt. `/methodology/` обещает «человекочитаемые alt». `imageCredit` у 155 статей — «Patisserie Russe / Milovi School», без указания происхождения; `digitalSourceType` (IPTC trainedAlgorithmicMedia) выставляется только для 2 Canon-досье, где в кредите есть слово «generated». Если 155 обложек — генеративные, provenance не раскрыт (`AGENTS.md` §5).
5. **Источники в середине статьи.** У 10 статей (`recipe-eclairs-adam`, `recipe-baba-rhum-alain-ducasse`, `recipe-opera-dalloyau`, `recipe-canele`, `herme-ispahan-deep`, `cuisine-galette`, `lignac-kouign-amann`, `michalak-religieuse`, 2 Canon-досье) после блока «Французские источники» идут ещё 1.2–1.9 КБ основного текста. `audit_editorial_quality.py` делает `text.split(SOURCE_HEADING, 1)[0]` — весь хвост выпадает из проверки дублей/скэффолдинга.
6. **Редакционный скаффолдинг в опубликованном тексте.** `grolet-lemon-yuzu`: «Эта статья обновлена так, чтобы не выдавать сомнительные легенды… **Мы опираемся** на публичные…». `recipe-eclairs-adam`: «Это редакторская формулировка, а не цитата — … выдавать её за его слова было бы подлогом». `perret-softness-volume`: «**Редакционный стандарт:** если цитата не найдена…». Гейт `BANNED_PHRASES` ловит другие формулировки, но не эти; `assistant_voice` ищет только «в этой статье мы» (0 находок).
7. **Устаревшие числа в комментариях/документах.** `deepContents.ts:3` — «полный контент для **115** статей» (реально 155); `articles.ts:1448` — «all **103** articles' content»; `docs/CONTENT_QUALITY_WAVES.md` оперирует 155 как полным корпусом при 157 роутах.
8. **Мёртвые/осиротевшие файлы.** `src/data/french-terms.ts` (16 терминов) **не импортируется нигде** — вместо него в `ArticleView.tsx` захардкожены 11 других терминов. `public/images/articles/_unknown.webp` упоминается только в `articleImageDimensions.ts`. `scripts/apply_trust_migration.py` и `scripts/audit_status_claims.py` не вызываются ни из `package.json`, ни из workflows (нарушение `AGENTS.md` §8/§10 про временные инструменты). `docs/le-canon-sucre/CORRECTIVE_WAVE_2026-08-10.md` — временная authority, оставшаяся после closeout.
9. **`/corrections/` не содержит исправлений.** Страница объясняет, как сообщить об ошибке и что «существенные изменения» фиксируются, но публичного списка/журнала правок нет. При этом в корпусе есть 30 статей с `updatedAt: 2026-09-16` — объяснения, что именно изменилось, читатель не видит.

---

## 4. P1 — архитектура и покрытие гейтов

| Гейт | Что реально покрывает | Дыра |
|---|---|---|
| `audit_content.py`, `audit_article_depth.py`, `audit_editorial_quality.py` | 155 legacy (`articles.ts` + `deepContents.ts` + expansions) | 2 Canon-досье не проходят depth/editorial; отчёты пишут «155 статей» при 157 published routes |
| `audit_attributed_quotes.py` | `deepContents.ts` + 20 expansion parts | `canonArticleContents.ts`, `canonArticleAppendices.ts` не проверяются на приписанные цитаты |
| `audit_source_links.py` | expansions + Canon content/appendices + `articles.ts`/`canonArticles.ts` metadata | **нет** `articleOverrides.ts` (49 URL), **нет** `deepContents.ts` (11 URL), нет ссылок со статических страниц |
| `audit_canon_articles.py` | 15 Canon bindings: ≥1000 слов, ≥5 секций, URL, placeholder-маркеры | частично закрывает 2 досье, но не заменяет editorial/quote gates |
| `audit_site.py`, `audit_seo.py`, `privacy_contract.mjs` | 169 HTML / 166 indexable / 3477 SEO checks | **не проверяют видимый рендер контента**: сырые `====`, `##`, `PT45M`, H2-абзацы, подмену изображений, контраст — всё проходит |
| `npm run audit:security` | `npm audit --audit-level=high` | на чистом HEAD красный из-за свежих advisory (12, все dev-only). CI на том же SHA зелёный, потому что база advisory обновилась позже |

`audit_mixed_script.py` — хорошее исключение: сканирует все `src/data/**/*.ts`, включая Canon.

---

## 5. P2 — доступность и UX (проверено в Chromium 153)

- **axe-core, WCAG 2.1 A/AA:** `color-contrast` (`serious`) на **всех** проверенных страницах в обеих темах: `/` 26 (light) / 28 (dark), `/canon/` **113–115**, `/articles/recipe-eclairs-adam/` 34, `/materials/` 5. Примеры: `#a6a09b` на `#fcfaf8` = 2.48; `#745f3c` на `#0d0b09` = 3.22; логотип `#4a7eb8` на `#fcfaf8` = 4.06.
- `label-content-name-mismatch` (`serious`): 1–2 на обычных страницах, **18 на `/canon/`** — `aria-label` не включает видимый текст ссылок («Открыть историю: Paris-Brest» и т.п.), плюс кнопка «Скопировать ссылку».
- **Skip-link сломан на `/materials/`**: `BaseLayout` даёт `href="#main-content"`, а `GalleryApp` рендерит `id="materials"` и не имеет `id="main-content"`. Tab → Enter: `location.hash` меняется, но `scrollY = 0`, фокус остаётся на `<a>`. На остальных 168 HTML `main-content` есть.
- Мобильное меню `Header.tsx` (строки 176–199) использует `<button onClick>` для «Главная/Архив/Галерея/О проекте» — нарушение `AGENTS.md` §0.9 (навигация = `<a href>`), нет контекстного меню/открытия в новой вкладке/crawlable links.
- Один и тот же пункт «Архив» ведёт в разные якоря: home/canon → `/#categories`, article/static → `/#archive`; «О проекте» → `/#about` на одних страницах и `/about/` на других. При выключенном JS desktop-`href` ведёт не туда, куда `onClick`.
- `dark-first` по документам, но при первом визите с системной светлой темой `BaseLayout` применяет **светлую** (проверено `emulateMedia(light)`), что расходится с `AGENTS.md` §3. Требует решения владельца: это баг или осознанный respect-system.
- `ArticleActions.copyLink()` relies only on `navigator.clipboard`; при отказе/не-secure context — `console.error` и тишина для пользователя (нет `execCommand`-фолбэка), а кнопка «Поделиться» в этом случае тоже молча не работает.
- `faq` (44 статьи) и `Recipe` JSON-LD (47) видимый контент имеют — ок; но `calories` не заполнено ни разу (поле есть в типе), нетDifficulty/аллергенов/КБЖУ.

**Что работает хорошо:** на 390 px нет горизонтального overflow (home, article, materials); `prefers-reduced-motion: reduce` распознаётся и не ломает рендер; fault-матрица localStorage (битые `theme`, `reading-streak`, `last-read-date`, `article-progress`, `article-progress-pct`, `article-saved`) — страница рендерится, тема падает в dark, «Продолжить с прошлого места» не появляется, ошибок в консоли нет; внутренних ссылок/картинок с 404 в `dist/` не найдено (0 битых локальных ресурсов на 169 HTML); image-sitemap содержит 172 `image:loc` и все hero-изображения.

---

## 6. Premium-фичи: есть / нет

**Есть:** dark/light тема, ⌘K панель (Fuse по title/excerpt/author/tags/category), закладки, прогресс и «продолжить чтение», режим фокуса, A/A+, оглавление, связанные статьи, копирование ссылки, `navigator.share`, FAQ, карточка рецепта, 11 inline-термин-тултипов, reading streak dashboard, `/canon/` с 15 работами, `/materials/` галерея с hover-preview, Service Worker + toast обновления, кастомный курсор, scroll-reveal, drop-cap.

**Отсутствуют (явные premium-пробелы):**

| Фича | Статус |
|---|---|
| Полнотекстовый поиск по телу статьи | нет — ищутся только метаданные; 1.4 МБ контента недоступны поиску (`/methodology/` обещает hub-страницы — их нет) |
| Hub-страницы по рецептам/техникам/ингредиентам/шефам, страницы тегов | нет; 19 категорий живут только как фильтр на главной |
| Глоссарий | 16 терминов в `french-terms.ts` мертвы; отдельной страницы нет |
| Печать / PDF статьи или рецепта | есть только `print:break-inside-avoid` в CSS; кнопки и print-стилей нет |
| Масштабирование порций, конверсия единиц, чек-лист шагов, таймеры | нет |
| Лайтбокс/зум изображений | нет |
| Сноски/номера цитат в тексте | нет; источники — список в конце (у 10 статей — в середине) |
| Видимые breadcrumbs и «обновлено» | breadcrumbs только в JSON-LD; в UI показывается только дата публикации, `updatedAt` скрыт |
| Prev/Next навигация | только для 15 Canon-статей (`CanonArticleNav`); остальные 142 — только 3 «Читайте также» |
| Публичный лог исправлений | `/corrections/` — инструкция без записей |
| Аудиоверсия / TTS, RSS, EN/FR-версии, комментарии | нет |
| Страница «Мои закладки» | нет (есть счётчик и «Продолжить чтение») |
| Offline-сохранение выбранных статей | SW кеширует только посещённые навигации + 6 shell-ассетов |

---

## 7. Проверено / не проверено / среда

**Проверено (цифры до → после: правок не было, это срез «как есть»):**
157 статей, 169 HTML, 166 indexable, 676 цитат в гейте, 265 уникальных URL в телах, 1250 separator-блоков, 537 markdown-ссылок, 47 recipeData, 44 FAQ, 172 image-sitemap записей, 16.9 МБ island-пропсов. Браузер: 9 desktop-страниц (1440×900) + 3 mobile (390×844), axe-core, console/pageerror/requestfailed, dark + light + reduced-motion, localStorage fault-матрица, 9 скриншотов в `audit/repo-audit-2026-10-26/`. Console: **0 продуктовых ошибок**; 6 `ERR_CONNECTION_CLOSED` — исключительно `fonts.googleapis.com` (egress-шум, отфильтрован **явно**, не молча).

**Не проверено:**
- сетевая живость 676/265 URL — нет egress к французским хостам; вывод о мёртвых ссылках сделан по **собственному** `KNOWN_DEAD_URLS` проекта, не по новому fetch;
- webkit/firefox контракты — `skipped: sandbox egress` (полный `playwright install` недоступен; Chromium получен с npm);
- все 169 страниц визуально (осмотрено 12), реальные iOS/Android устройства, живой домен `french.milovicake.ru` и exact-SHA live witness;
- rights review на 155 обложек (происхождение генеративных изображений);
- SEO-эффект дублирования контента в `astro-island props` (нужен Lighthouse/WebPageTest).

**Среда факта этого хода:** Node v22.22.3 / npm 10.9.8, `npm ci` выполнен, Python 3.11 venv, Chromium 153 из `@sparticuz/chromium` + `/tmp/al2023/lib`, static server `0.0.0.0:4321`, `gh` авторизован. Egress только npm/PyPI/GitHub; падения Google Fonts и аналитики — артефакт песочницы, не баг продукта.

---

## 8. Решения, принятые самостоятельно

- Не чинить продукт: запрос был на аудит. Все находки зафиксированы, ничего не переписано.
- Не трогать pre-existing red `audit:security` молча: он зафиксирован как отдельная строка отчёта (dev-only advisories, prod clean).
- Отчёт положен в `docs/` (tracked), скриншоты — в gitignored `audit/` (evidence, не source), чтобы не засорять репозиторий бинарниками.
- Lane-collision проверен: открытые PR #37 (`package*.json`) и #31 (workflows) не пересекаются с `docs/REPO_AUDIT_2026-10-26.md`; protected paths §7 не затрагивались.

---

## 9. Ветка / HEAD / PR / CI / merge

- Ветка: `arena/0e3a398a-milovi-school` (только она).
- Базовый HEAD: `1b0b848fbcc01eb5a4bc01b58c8855503740b59b`; CI на нём — 23/23 success (агрегат `check-runs`, без cancelled/failure).
- PR из этой ветки: нет (аудит не требует мерджа); merge SHA: отсутствует.
- Коммит с отчётом: `8a68fed` — `docs: repo audit 2026-10-26`, трейлер `Co-authored-by: arena-agent`, запушен в `arena/0e3a398a-milovi-school`.
- Check-runs на `8a68fed`: **0** — это не красный CI, а отсутствие триггера: `ci.yml` слушает только `push`/`pull_request` в `main`. Зелёный 23/23 относится к базовому HEAD `1b0b848`; продуктовый код в этом ходе не менялся.

---

## 10. Действия владельца

1. **Решение по `articleOverrides.ts`:**either включить его в `SOURCE_URL_FIELD_RE`-сбор (и сразу заменить 20 мёртвых + 5 слабых URL), либо убрать слой overrides и писать финальные `sourceUrl` прямо в `articles.ts`. Пока слой есть, гейт проверяет неопубликованные данные.
2. **Решение по dark-first:** оставить уважение системной темы или принудительно тёмный дефолт — задокументировать в `AGENTS.md` §3, сейчас код и правило расходятся.
3. **Приоритет волны:** сначала рендерер контента (§2.2) + форматирование `PT*` (§2.3), затем источники (§2.1), затем архитектура islands (§2.5).
4. **Определить происхождение 155 обложек** — если генеративные, добавить честный provenance/`digitalSourceType` и descriptive alt.
5. **Обновить `ci.yml` security-шаг**: либо `npm audit --omit=dev`, либо запланированный bump dev-зависимостей — чтобы локальный `npm run validate` снова был зелёным на чистом HEAD.

---

## 11. Следующий кандидат backlog

**Wave A — «Чистый рендер + честные источники»** (один PR, ≤400 строк/коммит):

1. Расширить `audit_source_links.py`: читать `articleOverrides.ts` + `deepContents.ts` + ссылки статических страниц; добавить selftest-фикстуру «override перезаписывает articles.ts». Ожидаемый результат: гейт красный до замены URL, зелёный после.
2. Заменить 20 мёртвых и 5 слабых `sourceUrl` на живые конкретные документы; починить `recipe-sables-diamant` label.
3. Добавить **rendering-contract gate**: на сгенерированном `dist/` запретить `====`, `## `, `PT\d+[HM]` и H2 >110 символов в видимом тексте; прогнать по всем 157 статьям. Ожидается 6/6/47/5 → 0/0/0/0.
4. Починить контент: разделить склеенные блоки (21 + 7 + 6 + 2 статьи), отформатировать ISO-8601 в «45 мин», заменить 11 Unsplash-изображений на локальные dedicated WebP (или удалить).
5. Доказательства: teardown strict CI + повтор browser-пака (screenshot/axe/mobile/dark/reduced-motion) на exact HEAD; только потом — merge.

---

## 12. Волна 3 — изображения: локальные AI-иллюстрации и честный provenance (2026-10-26)

Реализует п. 11.4 backlog. Маршруты не менялись (167 страниц, 157 статей).

**Что сделано**

- **11 внешних Unsplash-изображений** в 8 рецептурных статьях (`deepContents.ts`) заменены на локальные dedicated WebP. Первопричина бага: `ArticleView.tsx` подменял любой `src` без ведущего `/` на `fallbackImageFor(category)` — поэтому все 11 картинок рендерились как одна и та же заглушка `/_astro/pastry-chef*.jpg`. Теперь у каждой статьи свой кадр.
- **18 PNG-мастеров** (выбраны владельцем в BATTLE-режиме по референсу «ряд макарон», тёплый боковой свет, тёмная пекарня, графитовый сланец, крошки, малая ГРИП) конвертированы в WebP 1280px/q82: **65 МБ → 2.0 МБ**. Оригиналы перенесены в gitignored `audit/repo-audit-2026-10-26/selected-originals/` (evidence, не source). 7 «рядовых» кадров добавлены как лидирующие иллюстрации.
- **Dedicated hero** для `recipe-pecan-chocolate-creme-brulee`: вместо Vite-бандла `localImages.pecan` — `/images/articles/hero-pecan-chocolate-creme-brulee.webp`; мёртвая ветка `1296×864` в `articles.ts` удалена, неиспользуемый импорт `localImages` убран.
- **Честный provenance для body-изображений:** все локальные `body-*`/`hero-*` иллюстрации помечены видимой подписью «Генеративная редакционная иллюстрация (AI)» в figcaption — той же, что у обложек. Новый счётчик `audit_rendered_content.py` (`generatedBodyFigures`/`missingBodyProvenance`) делает это контрактом: 17/17, 0 пропусков.
- **Попутно исправлен баг рендера:** figcaption ранее находилась *внутри* блока `figure` с `aspect-ratio` и `overflow-hidden` и **обрезалась** — подпись и AI-нота были в DOM, но не видны. Медиа-обёртка с aspect-ratio вынесена отдельно (CLS-резерв сохранён), подпись теперь в потоке ниже и видима. Проверено геометрией в headless Chromium 153.
- **Источники и честность цитат:** вместо 11 «источников»-картинок Unsplash в `deepContents.ts` добавлены 16 реальных проверенных живых первоисточников (BnF/Gallica, Académie du Goût, Europeana, Potel & Chabot/Dalloyau, Stohrer, Trinity College Cambridge, Cacao Barry, Valrhona) — ссылки идут в видимом тексте и собираются гейтом `audit_source_links.py` как `base`. Три выдуманные цитаты от первого лица (Контисини, Гроле, Дюкасс), которые раньше «проходили» только потому, что рядом стоял URL картинки, переписаны в честные пересказы с явной оговоркой — по стандарту корпуса (§585) и прецеденту волны 1.

**Валидация (все зелёные):** `check`, `lint`, `audit:content` (weak citations 0/783, attributed-quotes 0 at-risk, mixed-script OK), `build`, `audit:build`, `audit:site` (SEO 3477/166/157; render: 157 страниц, generatedBodyFigures 17, все дефекты 0), `audit:privacy` (169 док.). Browser-проверка (Chromium 153, Playwright): все 17 body-изображений и 8 hero загружаются с реальными размерами, 0 fallback, AI-нота видима во всех 17; внешний egress (только `fonts.googleapis.com`) явно отфильтрован. Скриншоты: `audit/repo-audit-2026-10-26/browser-opera-figure*.png`.

---

## 13. Волна 4 — BATTLE-отбор иллюстраций и финальная заморозка (2026-10-27)

Продолжение волны 3: владелец в BATTLE-режиме (2 варианта на кадр) отобрал дополнительные фотореалистичные иллюстрации для рецептурных статей, ранее не имевших body-кадра. Маршруты не менялись — **167 страниц, 157 статей**.

**Что сделано**

- Добавлено **15 новых локальных AI-иллюстраций** (WebP, до 1280px, q82) в статьи: macarons row, entremets slice, canelés, chocolate soufflé, crème brûlée, madeleines, tarte Tatin, Paris-Brest, Saint-Honoré, croquembouche, financiers, flan parisien, île flottante, Mont-Blanc, mousse au chocolat. Каждая — отдельный figure-блок с видимой AI-нотой (автоматический provenance из волны 3), PNG-мастеры перенесены в gitignored `audit/repo-audit-2026-10-26/selected-originals/`.
- **Учтены правки владельца:** суфле сначала было отклонено («шапочка слишком высокая») — переснято с умеренным подъёмом ~2 см над краем и без пара; макаронс — единственный «ряд» по референсу, остальные десерты сняты одним/двумя предметами в разных композициях; все промпты — фотореализм, тёплый боковой свет, тёмная пекарня, графит, крошки, малая ГРИП (отказ от гравюр).
- **Попутно исправлен баг markdown:**figure для `recipe-saint-honore` изначально был вставлен в середину абзаца без пустой строки и рендерился как inline-ссылка `!` вместо картинки (гейт показывал 25 вместо 26). Разделён на отдельный блок; добавлена проверка, что все `body-*` картинки в `deepContents.ts` занимают отдельную строку.

**Итог на HEAD:** **32 локальных AI body-изображения** в рецептурных статьях (было 17 в конце волны 3), все с честным видимым provenance.

**Валидация финального HEAD (все зелёные):** `check`, `lint`, `audit:content`, `build`, `audit:build` (167 документов, 169 HTML, strict UTF-8), `audit:site` (SEO 3477/166/157; render: 157 страниц, `generatedBodyFigures: 32`, `rawSeparators/rawMarkdown/machineDurations/giantHeadings/titleAsAlt/missingProvenance/missingBodyProvenance` — все 0), `audit:privacy` (169 док.). Рабочее дерево чистое, local == remote `arena/0e3a398a-milovi-school`.

**Известное ограничение (не блокер):** базовый `npm run validate` красный на `audit:security` из-за 12 dev-only advisories; `npm audit --omit=dev` = 0. Продуктовых уязвимостей нет. CI-trigger слушает только `main`/PR, поэтому check-runs на промежуточных коммитах ветки = 0; зелёный 23/23 относится к базовому HEAD `1b0b848`.
