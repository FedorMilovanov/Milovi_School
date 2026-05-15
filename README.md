# Patisserie Russe — Astro SSG

**french.milovicake.ru** — библиотека о французской кондитерской школе.

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
french.milovicake.ru/articles/grolet-lemon-yuzu/  → index.html (статья)
... × 115 статей
```

| Проблема | Решение |
|---|---|
| `deepContents.ts` (~1.1 MB) в браузере | Только при сборке (build time) — в браузер не попадает |
| Яндекс не индексировал SPA | Каждая статья — готовый HTML с SEO meta, OG, JSON-LD |
| `window is not defined` при SSR | Все `localStorage` обёрнуты в `typeof window !== 'undefined'` |
| Навигация между статьями | URL-based: `window.location.href = /articles/${id}/` |

### Потоки данных

```
Сборка (build time):
  deepContents.ts (~1.1 MB)
    └─▶ articles.ts → [id].astro → HTML-страницы

Браузер (runtime):
  HomeApp          ← libraryMeta  (без content, лёгкий)
  ArticlePageShell ← один article (~10 KB content)
  CommandPalette   ← libraryMeta  (поиск без content)
```

---

## Быстрый старт

Требуется Node.js **22.12.0+**.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
npm run validate  # type-check + npm audit + build + статический аудит dist/
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
│   └── articles/[id].astro      # 115 статичных страниц
├── components/                  # React-компоненты
├── data/
│   ├── articles.ts              # ArticleMeta + Article types
│   ├── deepContents.ts          # Контент статей (только build time)
│   └── library.ts               # libraryMeta (без content, для браузера)
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

## Changelog — scroll & navigation audit (2026-05-14 v2)

| # | Fix | File |
|---|---|---|
| S1 | `overscroll-x-contain` на горизонтальном скроллере категорий — на iOS/Android свайп по категориям вызывал навигацию браузера назад/вперёд или захватывал вертикальный скролл страницы | `src/components/Categories.tsx` |
| S2 | `overscroll-x-contain` на ShowcaseSlider (drag-scroll слайдер с шефами) — та же проблема: горизонтальный свайп мог случайно скролить страницу вертикально | `src/components/ShowcaseSlider.tsx` |
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

