# Patisserie Russe — Astro SSG

**french.milovicake.ru** — библиотека о французской кондитерской школе.

---

## Superfix главной и reference-интерактивности (2026-05-20)

Эта серия правок защищает визуал главной страницы после переноса premium-эффектов из Drive/Arena-референса. Важно для будущих ИИ-агентов: эти решения считаются **зафиксированными**, их нельзя «упрощать» без прямого запроса владельца.

**Что изменено по главной (`index`):**
- блок «Знаковые творения / Иконы современной pâtisserie» удалён полностью;
- hero-заголовок закреплён в две строки: `Французская` / `Pâtisserie`, где `Pâtisserie` остаётся синим в dark/light;
- статистика `115 / 19 / 14 / 100%` получила reference 3D-hover (`translate3d`, `rotateX/Y`, `scale(1.045)`) и luxury-letter подсветку;
- карточки «Архив по темам» и `/materials/` используют один и тот же reference-hover: исходное фото растворяется, тёмная blur-копия проявляется, overlay остаётся читаемым;
- длинная портянка 115 материалов убрана с главной: поиск сохранён, результаты появляются только при поиске/выборе категории;
- отдельная визуальная галерея материалов доступна по `/materials/`, из шапки, футера, статистики и CTA «Открыть галерею →»;
- Astro `ClientRouter` / View Transitions отключены: переходы на статьи нативные, чтобы не зависали при уходе с тяжёлой главной;
- курсор оставлен визуально как в референсе, но не запускается на touch/iOS и ставит `requestAnimationFrame` на паузу в простое;
- `ShowcaseSlider.tsx`, временные patch-скрипты, `reference.html` и локальная `.config/astro` удалены/запрещены к коммиту.

**Reference-коэффициенты, которые нельзя менять без сверки:**
- stats: `dx*0.06`, `dy*0.05`, `dx*0.025`, `-dy*0.02`, `scale(1.045)`;
- card blur: `blur(40px) brightness(0.15) contrast(1.2) saturate(1.2)`;
- card overlay hover: `rgba(0,0,0,0.6) 0%`, `rgba(0,0,0,0.85) 45%`, `rgba(0,0,0,0.98) 100%`;
- hero `Pâtisserie`: dark `#6da8e2 → #1a7aef`, light `#4a7eb8 → #003ecf`.

---

## Аудит и обновления (Май 2026)

Проект прошел Apple-grade аудит архитектуры, кода и UI/UX (Аудит V2). Устранены все критические баги, утечки памяти, неработающий Service Worker и ошибки парсинга кулинарных текстов.

**Ключевые исправления:**
- **Оптимизация репозитория**: Удален тяжеловесный мусор из корневой директории (старые архивы на 48 МБ). Текущий вес чистого репозитория — ~16 МБ (из которых 15 МБ — изображения).
- **Parallax и Hero-изображения**: Восстановлена работа parallax-скролла (`<motion.img>`).
- **Списки рецептов (isList)**: Исправлен критический баг регулярных выражений, который превращал списки ингредиентов и температуры в сплошной текст (замена `\D` на `\S`).
- **Оптимизация Scroll Listeners**: Внедрен хук `useSyncExternalStore` — теперь на странице работает только один scroll listener вместо 4-5 параллельных, что устранило лаги на мобильных устройствах.
- **Service Worker и Кеширование**: Исправлен бесконтрольный рост кеша в браузере (добавлена очистка `trimCache`), а также двойная перезагрузка в `UpdateNotification`.
- **UI и Доступность**: Скругления `CommandPalette`, исправление перекрывающихся индексов Fuse.js (подсветка поиска), контрастность бейджа "Nouveau" (тёмный текст) и многое другое.
- **SEO и Breadcrumbs**: Исправлены дублирующиеся хлебные крошки (категории ссылаются на `/#archive`).

### Примечание по дизайну (Dark Theme)
**Внимание:** Тёмная тема (Dark Mode) является основной и специально задуманной темой по умолчанию для данного проекта. Она передаёт премиальность и атмосферу французской кондитерской (intentional design choice). Светлая тема также доступна и включается автоматически, если у пользователя стоит системная настройка, либо при ручном переключении, но основной опыт — тёмный режим. 
(Был устранен баг, из-за которого страницы статей принудительно включали тёмную тему даже для light-пользователей).

## Архитектура

```
french.milovicake.ru/                              → index.html (главная)
french.milovicake.ru/materials/                     → index.html (визуальная галерея 115 материалов)
french.milovicake.ru/articles/grolet-lemon-yuzu/  → index.html (статья)
... × 115 статей
```

| Проблема | Решение |
|---|---|
| `deepContents.ts` (~1.1 MB) в браузере | Только при сборке (build time) — в браузер не попадает |
| Яндекс не индексировал SPA | Каждая статья — готовый HTML с SEO meta, OG, JSON-LD |
| `window is not defined` при SSR | Все `localStorage` обёрнуты в `typeof window !== 'undefined'` |
| Навигация между статьями | Native MPA через `src/utils/navigation.ts`; Astro `ClientRouter` запрещён из-за зависаний |

### Потоки данных

```
Сборка (build time):
  deepContents.ts (~1.1 MB)
    └─▶ articles.ts → [id].astro → HTML-страницы

Браузер (runtime):
  HomeApp          ← libraryClientMeta (без content, лёгкий)
  GalleryApp       ← libraryClientMeta (115 карточек без content)
  ArticlePageShell ← один article (~10 KB content)
  CommandPalette   ← libraryClientMeta (поиск без content)
```

---

## Быстрый старт

Требуется Node.js **22.13.0+** (из-за актуальных требований ESLint/Astro toolchain).

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
npm run validate  # check + lint + content/security audit + build + site audit
npm run preview  # предпросмотр dist/
```

---

## Деплой

Автоматически при пуше в `main` → `.github/workflows/deploy.yml`.

**Требования:**
1. GitHub Settings → Pages → Source: **GitHub Actions**
2. `CNAME` в корне (`french.milovicake.ru`) — уже есть
3. DNS: `CNAME french → <username>.github.io`

---

## SEO

Каждая статья: `<title>`, `<meta description>`, Open Graph, Twitter Card, `<link rel="canonical">`, JSON-LD (`@type: Article`), sitemap через `@astrojs/sitemap`.

---

## Структура

```
src/
├── layouts/BaseLayout.astro     # HTML shell, SEO, OG, JSON-LD
├── pages/
│   ├── index.astro              # Главная → <HomeApp client:load />
│   ├── materials.astro          # Галерея материалов → <GalleryApp client:load />
│   └── articles/[id].astro      # 115 статичных страниц
├── components/                  # React-компоненты
│   ├── gallery/GalleryApp.tsx    # Визуальная галерея /materials/
├── data/
│   ├── articles.ts              # ArticleMeta + Article types
│   ├── deepContents.ts          # Контент статей (только build time)
│   └── library.ts               # libraryArticles (build-time) + libraryClientMeta (browser-safe)
├── utils/
│   ├── plural.ts                # Русское склонение: pluralRu(n, форма)
│   ├── storage.ts               # localStorage с SSR-guard
│   └── streak.ts                # Серия ежедневного чтения
└── styles/global.css            # CSS-переменные, типографика, анимации
```

---

## Утилиты

### `src/utils/plural.ts`

Правильное русское склонение числительных, включая исключения для 11–19.

```ts
import { pluralRu, MATERIAL, RESULT, HEADING, DAY } from './utils/plural'

pluralRu(1,  MATERIAL) // → 'материал'
pluralRu(3,  MATERIAL) // → 'материала'
pluralRu(11, MATERIAL) // → 'материалов'
pluralRu(21, MATERIAL) // → 'материал'
```

Доступные наборы: `MATERIAL`, `RESULT`, `HEADING`, `DAY`.

---

## Добавление статей

1. Добавьте объект в `src/data/articles.ts`
2. Добавьте контент в `src/data/deepContents.ts`
3. `npm run build` — Astro сгенерирует HTML автоматически






## Changelog — SEO/data quality hardening (2026-05-20)

| # | Fix | File |
|---|---|---|
| D1 | Article JSON-LD получил `articleBody` из очищенного markdown-текста, ограниченный 1500 символами | `src/pages/articles/[id].astro` |
| D2 | Fallback thin content в `articles.ts` запрещён: при отсутствии `deepContents` сборка падает вместо выпуска шаблонной страницы | `src/data/articles.ts` |

---

## Changelog — premium gallery preview (2026-05-20)

| # | Fix | File |
|---|---|---|
| G1 | В `/materials/` добавлен luxury expanded preview при наведении/focus: большое изображение, описание, категория, теги, время чтения, навигация Пред./След., кнопки «Читать материал» и «Свернуть» | `src/components/gallery/GalleryApp.tsx`, `src/styles/global.css` |
| G2 | Preview не ломает мелкие карточки: клик по карточке по-прежнему открывает статью; hover/focus только обновляет premium-окно | `src/components/gallery/GalleryApp.tsx` |
| G3 | `/materials/` усилена SEO-разметкой `CollectionPage` + `BreadcrumbList` | `src/pages/materials.astro` |

---

## Changelog — audit hardening pass (2026-05-20)

| # | Fix | File |
|---|---|---|
| A1 | Сверены P0/P1-находки внешнего аудита: ассеты `placeholder.svg`, `logo*.png`, `og-preview.webp` реально существуют; `materials.astro` уже имеет SEO meta | `public/images/*`, `src/pages/materials.astro` |
| A2 | React runtime/types выровнены: проект остаётся на React 18, `@types/react`/`@types/react-dom` откатаны на 18.x | `package.json`, `package-lock.json` |
| A3 | 404-страница получила настоящий HTTP 404 и `robots="noindex, follow"` | `src/pages/404.astro`, `src/layouts/BaseLayout.astro` |
| A4 | Query-дубли поиска закрыты от crawl через robots | `public/robots.txt` |
| A5 | CommandPalette вынесена в lazy chunk и не грузится до открытия поиска | `HomeApp.tsx`, `ArticlePageShell.tsx`, `GalleryApp.tsx` |
| A6 | SW install стал устойчивым к будущему отсутствию precache-ассета; SW hash теперь content-based, не random UUID | `public/sw.js`, `astro.config.mjs` |
| A7 | Добавлены Vite alias `@/*`, отдельный `react` chunk, NaN guard в DashboardBento, reduced-motion для skeleton shimmer, JS-safe custom cursor fallback | `astro.config.mjs`, `DashboardBento.tsx`, `global.css`, `Cursor.tsx` |

---

## Changelog — index/materials reference superfix (2026-05-20)

| # | Fix | File |
|---|---|---|
| R1 | Удалён устаревший showcase-блок «Знаковые творения / Иконы современной pâtisserie» | `src/components/ShowcaseSlider.tsx` (removed) |
| R2 | Главная больше не показывает портянку 115 статей: поиск и категории сохранены, результаты появляются только после запроса/выбора | `src/components/HomeApp.tsx`, `src/components/Categories.tsx` |
| R3 | Добавлена отдельная визуальная галерея `/materials/`, ссылки из шапки, футера, статистики и CTA | `src/pages/materials.astro`, `src/components/gallery/GalleryApp.tsx`, `Header/Footer/Categories/StatsBar` |
| R4 | Reference-hover карточек закреплён: blur-копия + чёрный overlay + движение текста, без наследования старого `scale(1.04)` | `src/styles/global.css`, `MainCategories.tsx`, `GalleryApp.tsx` |
| R5 | Stats `115/19/14/100%` получили reference 3D-hover и luxury-letter подсветку | `src/components/StatsBar.tsx`, `src/components/Cursor.tsx`, `src/styles/global.css` |
| R6 | `ClientRouter` отключён: переходы на статьи нативные, чтобы не зависали после тяжёлой главной | `src/layouts/BaseLayout.astro`, `src/utils/navigation.ts` |
| R7 | Курсор оптимизирован: touch/iOS early-return, rAF pause в простое, без потери visual reference | `src/components/Cursor.tsx` |
| R8 | CI и репо-гигиена: Node 22.13.0 в workflow, lint/content audit в CI, `.config/` и `reference.html` запрещены к коммиту | `.github/workflows/deploy.yml`, `.gitignore`, `AGENTS.md`, `README.md` |

---

## Changelog — final QA hardening (2026-05-16)

| # | Fix | File |
|---|---|---|
| FQ1 | Безопасная кнопка «Назад» в статье: больше не уводит пользователя на внешний referrer при прямом заходе из Google/мессенджеров; browser back используется только при same-origin referrer | `src/components/ArticlePageShell.tsx` |
| FQ2 | Убран вложенный `<main>` на страницах статей (`ArticlePageShell` теперь единственный landmark), audit добавил проверку ровно одного `<main>` | `src/components/ArticleView.tsx`, `scripts/audit_site.py` |
| FQ3 | Исправлены потенциальные hydration mismatches для темы и article-предпочтений: SSR и первый client render теперь совпадают, а реальные значения синхронизируются после mount | `src/components/HomeApp.tsx`, `src/components/ArticlePageShell.tsx`, `src/components/ArticleView.tsx` |
| FQ4 | CI закреплён на Node 22.13.0 и запускает lint + content audit до build; убран EBADENGINE warning от ESLint toolchain | `.nvmrc`, `package.json`, `.github/workflows/deploy.yml` |
| FQ5 | `audit_site.py` больше не печатает отчёт дважды | `scripts/audit_site.py` |

---

## Changelog — scroll & navigation audit (2026-05-14 v2)

| # | Fix | File |
|---|---|---|
| S1 | `overscroll-x-contain` на горизонтальном скроллере категорий — на iOS/Android свайп по категориям вызывал навигацию браузера назад/вперёд или захватывал вертикальный скролл страницы | `src/components/Categories.tsx` |
| S2 | Устаревший ShowcaseSlider удалён: блок «Иконы современной pâtisserie» больше не рендерится на главной и не тянет лишний drag-scroll код | `src/components/ShowcaseSlider.tsx` (removed) |
| S3 | `overscroll-behavior: contain` на вертикальном списке CommandPalette (`cp-list`) — при доскролле до конца списка скролл «прорывался» на body-контент за оверлеем | `src/components/CommandPalette.tsx` |
| S4 | `overscroll-behavior-x: contain` на горизонтальных чипах категорий в CommandPalette (`cp-chips`) — аналогичная горизонтальная утечка скролла | `src/components/CommandPalette.tsx` |

---

## Changelog — mobile bugfix round (2026-05-14)

| # | Fix | File |
|---|---|---|
| M1 | `viewport-fit=cover` добавлен в `<meta viewport>` — без него все `env(safe-area-inset-*)` возвращали 0 на iPhone с чёлкой/Dynamic Island; safe-area padding в баре, командной палитре и hero теперь работает | `src/layouts/BaseLayout.astro` |
| M2 | iOS Safari zoom bug: input в CommandPalette имел `font-size: 14px` → Safari автоматически зумил страницу при фокусе. Исправлено: `text-[16px] md:text-[14px]` | `src/components/CommandPalette.tsx` |
| M3 | ScrollToTop перекрывался мобайл-баром на notched iPhone: `bottom-[5.5rem]` (88px) < высота бара + safe-area (~93px). Исправлено: `calc(5.5rem + env(safe-area-inset-bottom, 0px))` | `src/components/ScrollToTop.tsx` |
| M4 | Toast — тосты уходили за мобайл-бар на iPhone X+. Аналогичный calc-фикс с safe-area | `src/components/Toast.tsx` |
| M5 | UpdateNotification — то же перекрытие баром на мобайле (`bottom: 5rem` = 80px < 93px). Исправлено: `calc(5rem + env(safe-area-inset-bottom, 0px))` | `src/components/UpdateNotification.tsx` |
| M6 | `-webkit-tap-highlight-color: transparent` — убрана серая вспышка при тапе на iOS (не была задана нигде в проекте) | `src/styles/global.css` |
| M7 | `will-change: transform` always-on убран с `.moving-word`, `.haptic-btn`, `.cat-img` — GPU memory leak на мобайле. Теперь применяется только в момент hover/active/animation | `src/styles/global.css` |
| M8 | Кнопки «Сохранить» и «Фокус» в мобайл-баре статьи не имели класса `haptic-btn` — анимация нажатия была только у «Назад» и «Размер». Теперь все 4 кнопки единообразны | `src/components/ArticleView.tsx` |

---

## Changelog — bugfix round (2026-05-12)

| # | Fix | File |
|---|---|---|
| P1  | Added GitHub Actions deploy workflow | `.github/workflows/deploy.yml` |
| P2  | Removed stale `public/sitemap.xml` and `public/feed.xml` (now generated by `@astrojs/sitemap`) | `public/` |
| P3  | Removed dead `<link rel="alternate" type="application/rss+xml">` from BaseLayout | `src/layouts/BaseLayout.astro` |
| P4  | Recipe JSON-LD emitted **only** when `recipeData` is fully populated AND ≥2 numbered steps are extracted from content (no more spam stubs) | `src/pages/articles/[id].astro` |
| P4b | Article JSON-LD `author` is now an array of `Person` objects parsed from the source string | `src/pages/articles/[id].astro` |
| P5  | All inline `<script type="application/ld+json">` got `is:inline` to silence Astro hints | `src/pages/index.astro`, `src/pages/articles/[id].astro` |
| P6  | Normalised `recipe-soufflé-chocolat` → `recipe-souffle-chocolat` (id ↔ deepContents key parity) | `src/data/articles.ts`, `src/data/deepContents.ts` |
| P7  | TypeScript: removed dead `normalizeStars`, `formatTime`; null-guarded `lPart.content`; tightened `isList` regex to ignore year stamps | `src/components/ArticleView.tsx` |
| P8  | StatsBar/HomeApp: chef counter now reflects real chef categories (was inflated by source citations) | `src/components/HomeApp.tsx`, `src/components/StatsBar.tsx` |
| P9  | All article cards rendered as `<a href>` (not `<button>`) — Google can crawl internal links, middle-click works | `src/components/ArticlesGrid.tsx` |
| P10 | ContinueReading cards → `<a href>` | `src/components/ContinueReading.tsx` |
| P11 | DashboardBento "Продолжить чтение" → `<a href>` | `src/components/DashboardBento.tsx` |
| P12 | Article "Related" cards → `<a href>` | `src/components/ArticleView.tsx` |
| P13 | Service Worker cache version is bumped on every build via `astro:build:done` integration → UpdateNotification finally fires | `public/sw.js`, `astro.config.mjs` |
| P14 | Removed fake newsletter form (silently dropped emails) | `src/components/Footer.tsx` |
| P15 | Header logo + nav links → real `<a href>` | `src/components/Header.tsx` |

