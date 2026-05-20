# AGENTS.md — Milovi School / Patisserie Russe (french.milovicake.ru)

> **Если ты ИИ-агент — этот файл обязателен к прочтению ДО любого изменения кода.**
>
> Этот проект — **Astro SSG + React/TypeScript**. Стандарты выше, чем у статических сайтов: строгий TypeScript, ESLint, Tailwind 4, SSR-safe код. Тут «смелые» правки разрушают сборку.

**Владелец:** Виктория Милованова (бренд Milovi)
**Производственный сайт:** https://french.milovicake.ru
**Дата документа:** 2026-05-20 | **Версия:** AGENTS-r5

---

## 0. TLDR — что СРАЗУ нельзя делать

1. ❌ Создавать компоненты/страницы/hooks/utils вне `src/`. Исходники в корне репозитория запрещены: они ломают `astro check`.
2. ❌ Менять `astro.config.mjs`, `tsconfig.json`, `eslint.config.js` без согласия.
3. ❌ Обновлять зависимости в `package.json` (Astro / React / Tailwind / Fuse).
4. ❌ Импортировать `deepContents.ts` в **client islands** (это 1.1 MB → в браузер не должен попадать).
5. ❌ Использовать `localStorage` / `window` / `document` **без** обёртки `typeof window !== 'undefined'`.
6. ❌ Менять Tailwind utility-классы на inline `style=` или CSS-модули.
7. ❌ Удалять Service Worker (`public/sw.js`) или менять `__BUILD_HASH__` placeholder.
8. ❌ **Менять дефолт тёмной темы — ЗАПРЕЩЕНО.** Тёмная тема — фирменный стиль бренда. `HomeApp` начинает с `'dark'`, pre-paint скрипт применяет `dark` по умолчанию. Это intentional design. (→ §3.4)
9. ❌ Возвращать Astro `ClientRouter` / `astro:transitions` запрещено: он уже вызывал зависания при переходах на статьи.
10. ❌ Возвращать портянку 115 статей на главную запрещено: `/materials/` — отдельная галерея, а на главной остаётся поиск.
11. ❌ Менять reference-hover карточек/цифр/hero без сверки с Drive-референсом запрещено.
12. ✅ После любой правки — `npm run check && npm run lint && npm run build`.
13. ✅ Перед коммитом — `npm run validate` (полный пакет проверок).

---

## 1. О проекте

- **Что это:** библиотека статей о французской кондитерской школе (115+ статей).
- **Стек:** **Astro 6 + React 18 + TypeScript (strict) + Tailwind 4 + Fuse.js + framer-motion**.
- **Хостинг:** GitHub Pages (через GitHub Actions).
- **Node:** требуется `>=22.13.0`, `npm >=10.9.2`.
- **Поиск:** клиентский (`fuse.js`) — обновляется на каждой сборке.

---

## 2. АРХИТЕКТУРА — единственно верная

```
/
├── astro.config.mjs                ← Astro + кастомные интеграции (НЕ ТРОГАТЬ)
├── tsconfig.json                   ← strict TS + path alias @/* → src/*
├── eslint.config.js                ← ESLint Flat config
├── package.json                    ← зависимости + scripts (НЕ обновлять без запроса)
├── .nvmrc                          ← Node 22.13.0
├── .github/workflows/deploy.yml
│
├── src/
│   ├── pages/                      ← Astro-страницы (= URL)
│   │   ├── index.astro             ← главная (libraryClientMeta, без content)
│   │   ├── materials.astro         ← отдельная visual gallery 115 материалов
│   │   ├── about.astro
│   │   ├── methodology.astro
│   │   ├── 404.astro
│   │   └── articles/
│   │       └── [id].astro          ← динамический роут (одна статья)
│   │
│   ├── layouts/
│   │   └── BaseLayout.astro        ← общий layout (<head>, meta, SEO)
│   │
│   ├── components/                 ← React Islands
│   │   ├── HomeApp.tsx             ← корневой client island главной
│   │   ├── ArticleView.tsx, ArticlePageShell.tsx, ArticleActions.tsx
│   │   ├── Header.tsx, Footer.tsx, Hero.tsx, StaticPageShell.tsx
│   │   ├── CommandPalette.tsx      ← Ctrl+K поиск (Fuse.js)
│   │   ├── Categories.tsx, MainCategories.tsx, ArticlesGrid.tsx
│   │   ├── DashboardBento.tsx, StatsBar.tsx, ContinueReading.tsx
│   │   ├── Cursor.tsx, LuxuryText.tsx
│   │   ├── gallery/GalleryApp.tsx   ← `/materials/`, same card-hover as archive
│   │   ├── ImageWithFade.tsx
│   │   ├── ScrollProgress.tsx, ScrollReveal.tsx, ScrollToTop.tsx
│   │   ├── MobileBottomBar.tsx, UpdateNotification.tsx
│   │   ├── ErrorBoundary.tsx, Toast.tsx, ReadingTime.tsx
│   │
│   ├── hooks/                      ← React hooks
│   │   ├── useScrollDirection.ts
│   │   └── useScrollProgress.ts
│   │
│   ├── data/                       ← ⭐ ЗДЕСЬ ВСЯ ДАННОСТЬ
│   │   ├── types.ts                ← Article, ArticleMeta, ArticleClientMeta
│   │   ├── articles.ts             ← сборка + helpers
│   │   ├── library.ts              ← libraryArticles build-time + libraryClientMeta browser-safe
│   │   ├── deepContents.ts         ← ⚠️ ~1.1 MB! ТОЛЬКО build-time!
│   │   ├── categories.ts           ← список категорий
│   │   ├── french-terms.ts         ← словарь терминов
│   │   └── articleImageDimensions.ts
│   │
│   ├── utils/
│   │   ├── storage.ts              ← SSR-safe localStorage (ОБЯЗАТЕЛЬНО использовать)
│   │   ├── search.ts               ← Fuse конфиг (вынесен из HomeApp)
│   │   ├── navigation.ts           ← native navigation helper для программных переходов
│   │   ├── highlight.tsx           ← подсветка результатов поиска
│   │   ├── plural.ts               ← русские плюрализация
│   │   └── streak.ts               ← логика "стрика" чтения
│   │
│   ├── styles/
│   │   └── global.css              ← один глобальный CSS (Tailwind 4 layers)
│   │
│   ├── assets/
│   │   └── images.ts               ← Astro image imports (build-time)
│   │
│   └── vite-env.d.ts               ← Vite типы
│
├── public/                         ← статика, копируется в dist/ как есть
│   ├── sw.js                       ← Service Worker (с __BUILD_HASH__ placeholder)
│   ├── favicon.svg, images/        ← логотипы, категории, `logo-maskable.png` для PWA
│   └── google*.html, yandex*.html  ← верификации поисковиков
│
├── scripts/                        ← Python build-time скрипты
│   ├── audit_site.py               ← проверка dist/
│   ├── audit_content.py            ← проверка контента
│   └── optimize-hero.ps1
│
└── audit/site-audit-report.md      ← последний отчёт аудита (обновляется CI)
```

### 2.1 Корень репозитория — только конфиги и документация

В корне **не должно быть** React/Astro/CSS/TS source-файлов вроде `ArticleView.tsx`, `HomeApp.tsx`, `about.astro`, `global.css`, `storage.ts`.

Почему это критично:
- реальные рабочие файлы лежат в `src/components`, `src/pages`, `src/styles`, `src/utils`;
- TypeScript/Astro всё равно сканирует source-файлы в корне;
- дубликаты в корне имеют неправильные относительные импорты (`../data`, `../utils`, `./Toast`) и дают десятки ошибок в `astro check`;
- если в корне оказался «большой файл с кодом», это почти всегда копия/мусор после upload. Нужные изменения надо переносить в canonical-файл внутри `src/`, а корневой дубль удалять.

Разрешены в корне: `README.md`, `AGENTS.md`, `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.nvmrc`, workflow/config-файлы. Запрещены в корне: `reference.html`, временные `.py`, `.patch`, `.zip`, локальная `.config/astro/`.

---

## 3. PROTECTED — НЕ ТРОГАТЬ

### 3.1 `deepContents.ts` НИКОГДА не в client island (КРИТИЧНО)

`src/data/deepContents.ts` — **~1.1 MB** полного контента статей.

✅ ПРАВИЛЬНО (build-time):
```astro
// src/pages/articles/[id].astro
---
import { getArticleById } from '../../data/library'
const article = getArticleById(Astro.params.id)
---
<ArticlePageShell article={article} client:load />
```

❌ ЗАПРЕЩЕНО (попадёт в браузер):
```tsx
// src/components/AnyComponent.tsx
import { deepContents } from '../data/deepContents'  // 1.1 MB в браузер!
```

**Правило:**
- `deepContents.ts` импортируется **только** из `library.ts` / `articles.ts`
- `library.ts` импортируется **только** из `.astro` файлов (build-time)
- Client islands импортируют **только** `types.ts`, `categories.ts`, `ArticleClientMeta`

Если нужно передать данные в client island — используй `ArticleClientMeta` (без `content`).

### 3.2 SSR-safe доступ к browser APIs

В Astro компоненты выполняются и на сервере (build-time SSR), и в браузере. Прямой `localStorage.getItem()` сломает сборку.

✅ Использовать helpers из `src/utils/storage.ts`:
```ts
import { safeGetItem, safeSetItem, safeRemoveItem } from '../utils/storage'

const value = safeGetItem('reading-progress')  // null на сервере, ok в браузере
```

❌ Запрещено:
```ts
const value = localStorage.getItem('x')  // crash на build!
const w = window.innerWidth              // crash на build!
```

Если нужен прямой доступ — оборачивай:
```ts
if (typeof window !== 'undefined') {
  // безопасно для браузера
}
```

### 3.3 Service Worker (`public/sw.js`)

Содержит **placeholder `__BUILD_HASH__`**, который заменяется в `astro.config.mjs` хук'ом `bumpServiceWorkerVersion()` на свежий хеш на каждой сборке.

❌ Запрещено:
- Удалять `__BUILD_HASH__` из `sw.js`
- Менять имена `CACHE_VERSION` / `CACHE_NAMES` без проверки `UpdateNotification.tsx`
- Удалять `trimCache()` логику — без неё кеш растёт бесконтрольно

### 3.4 Тёмная тема — ОСНОВНАЯ, неизменяемая (intentional design)

> ⛔ **ЗАПРЕЩЕНО менять**: тёмная тема — не «опция», это фирменный стиль бренда Milovi.
> Любое изменение дефолта (dark → light) является ОШИБКОЙ и должно быть немедленно отменено.

**Почему:** Бренд Milovi строится на премиальной эстетике французской кондитерской — тёмные тона золото — это художественный выбор владельца. Светлая тема — вспомогательная альтернатива для тех, кто явно её выбирает.

**Правила, которые НЕЛЬЗЯ нарушать:**
1. `HomeApp.tsx`: начальное состояние темы = `'dark'` (`useState<'light' | 'dark'>('dark')`)
2. `BaseLayout.astro`: pre-paint скрипт читает `localStorage.getItem('theme')` и по умолчанию применяет `'dark'` если ничего не сохранено
3. `global.css`: `:root` содержит светлые токены (fallback), `.dark` — тёмные (основные в работе)
4. Все новые CSS-переменные должны иметь корректные значения в обоих блоках `:root` и `.dark`

В `global.css`:
```css
:root {
  /* Светлая тема — резервный вариант */
  --bg-main: #fcfaf8;
}

.dark {
  /* ОСНОВНАЯ тема сайта */
  --bg-main: #10100f;
}
```

Был баг: страницы статей принудительно включали тёмную тему даже для light-пользователей. **Исправлено в Мае 2026 — не возвращать!**

### 3.5 Парсинг рецептов: `isList` regex

В `src/utils/highlight.tsx` есть critically важный regex для `isList()`. Историческая поломка: `\D` (не-цифра) вместо `\S` (не-пробел) превращала списки ингредиентов («150 г муки + 80 г сахара…») в сплошной текст.

**Правило:** не «оптимизировать» regex без полного тест-набора рецептов.

### 3.6 Fuse.js конфиг

`src/utils/search.ts` содержит `ARTICLE_FUSE_OPTIONS`. Был баг с **дублирующимися индексами** подсветки. Исправлен — не возвращать к старому конфигу.

### 3.7 Атрибуция

Все статьи — **переводы и адаптации** из французских источников + проверка ИИ. **Не указывать "Автор: Виктория Милованова"** в статьях. Если нужно — спросить владельца про формат.

### 3.8 Навигация и View Transitions

`src/layouts/BaseLayout.astro` использует нативную MPA-навигацию; Astro ClientRouter отключён из-за подвисаний при переходах на статьи.

Программные переходы из React-islands должны идти через:

```ts
import { navigateTo } from '../utils/navigation'
void navigateTo('/articles/example/')
```

Не использовать `window.location.href = ...` напрямую для внутренних переходов, если нет специальной причины. `navigateTo()` делает **нативную MPA-навигацию** (`window.location.assign/replace`) и специально НЕ использует Astro client router.

Клик по тегу внутри статьи не должен уводить пользователя reload-ом на `/?q=`: правильный паттерн — открыть `CommandPalette` с `initialQuery`.


### 3.9 Protected reference effects: главная, статистика, галерея

Эти коэффициенты перенесены из Drive/Arena-референса и считаются зафиксированными. Нельзя «улучшать» их на глаз.

**Hero:**
- `Французская` и `Pâtisserie` — две строки.
- `Pâtisserie` всегда синий italic: dark `#6da8e2 → #1a7aef`, light `#4a7eb8 → #003ecf`.

**Stats `#stats`:**
- motion: `dx * 0.06`, `dy * 0.05`, `dx * 0.025`, `-dy * 0.02`, `scale(1.045)`.
- CSS: `perspective: 900px`, `transform-style: preserve-3d`.
- hover colors: light `#c8873e`, dark `#e8b86a`.

**Archive/gallery cards:**
- один эффект для `MainCategories` и `/materials/`;
- source image fades to `opacity:0`;
- blur-copy: `blur(40px) brightness(0.15) contrast(1.2) saturate(1.2)`;
- overlay hover: `rgba(0,0,0,0.6) 0%`, `rgba(0,0,0,0.85) 45%`, `rgba(0,0,0,0.98) 100%`;
- luxury card must override old generic `.cat-img-card:hover .cat-img` scale/brightness via `.cat-img-card-lux:hover .cat-card-img-lux { opacity:0; transform:none; filter:none; }`;
- body: `translateY(-12px)`, title: `scale(1.02) translateY(-6px)`.

**Главная:**
- НЕ возвращать `ShowcaseSlider.tsx` / «Знаковые творения» / «Иконы современной pâtisserie».
- НЕ возвращать список 115 статей подряд на главную. Главная: hero → stats → archive cards → search/categories → compact blocks → footer/about.
- `/materials/` — единственное место для общей визуальной галереи всех материалов.


### 3.10 Runtime/type alignment and SEO hardening

- Runtime React is 18.x; `@types/react` and `@types/react-dom` must stay on matching 18.x unless the project explicitly migrates to React 19.
- `/404.html` must keep HTTP status 404 and `robots="noindex, follow"`.
- Search query duplicates (`?q=` / `&q=`) are blocked in `robots.txt`; do not remove without adding another canonical/noindex strategy.
- Custom cursor hiding must stay behind the JS-added `html.cursor-effects-enabled` class. Never set global `cursor:none` without JS fallback.
- CommandPalette should stay lazy-loaded; do not reintroduce a static import into `HomeApp`, `ArticlePageShell` or `GalleryApp`.

---

## 4. STYLING — Tailwind 4

### 4.1 Один CSS-файл

Весь глобальный CSS — в **`src/styles/global.css`**. Не создавать новых `.css` модулей.

### 4.2 Используй Tailwind утилиты

✅ ПРАВИЛЬНО:
```tsx
<div className="flex items-center gap-4 p-6 rounded-2xl bg-amber-50 dark:bg-stone-900">
```

❌ Запрещено:
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
```

### 4.3 Кастомные стили — только если Tailwind не покрывает

Тогда добавляй в `global.css` через `@layer components` (НЕ в `@layer utilities` — это сломает порядок специфичности).

### 4.4 Тёмная тема

Используй Tailwind `dark:` prefix везде, где нужно отличие. Не пиши свой `[data-theme="dark"]` CSS — Tailwind делает это сам.

---

## 5. TYPESCRIPT — строгий режим

### 5.1 `tsconfig.json` extends `astro/tsconfigs/strict`

- `strict: true`
- `noUncheckedIndexedAccess` (вероятно)
- Никаких `any` без явного `// eslint-disable`

### 5.2 Типы для данных

Все статьи типизированы через `Article`, `ArticleMeta`, `ArticleClientMeta` в `src/data/types.ts`. **Любая правка типа — синхронно во всех 3 интерфейсах**.

### 5.3 Запреты

- ❌ Не использовать `any` (используй `unknown` + type guards)
- ❌ Не использовать `as Article` без рантайм-проверки
- ❌ Не отключать ESLint правила без комментария-обоснования
- ❌ Не игнорировать `astro check` ошибки

---

## 6. ASTRO — особенности

### 6.1 Client directives

В Astro компонент React требует **client directive**, иначе он SSR-only:

| Директива | Когда |
|---|---|
| `client:load` | При загрузке страницы (interactive ASAP) |
| `client:idle` | После idle (ScrollProgress, Toast) |
| `client:visible` | Когда виден (ImageWithFade) |
| `client:only="react"` | Только в браузере (если SSR ломается) |

**Правило:** не использовать `client:load` на тяжёлых компонентах. Сначала `client:visible` или `client:idle`.

### 6.1.1 StaticPageShell

`src/components/StaticPageShell.tsx` — единственная разрешённая React-обёртка для статических Astro-страниц `/about/` и `/methodology/`. Она подключает общий `Header`/`Footer`, не импортирует `deepContents.ts` и не должна превращаться во второй `HomeApp`. Поиск со статических страниц ведёт на `/?command=1`, где палитра открывается уже внутри основной SPA.

### 6.2 Astro Image оптимизация

Используй `<Image>` из `astro:assets`, не `<img>`, для статей. Это даёт автоматический resize + WebP + AVIF.

### 6.3 Layout

Все страницы используют `BaseLayout.astro` через `<BaseLayout title="..." description="...">`. Не дублировать `<head>` в страницах.

---

## 7. ОБЯЗАТЕЛЬНЫЕ ПРОВЕРКИ перед коммитом

```bash
# 1. TypeScript + Astro
npm run check          # astro check

# 2. ESLint
npm run lint           # eslint .

# 3. Сборка
npm run build          # astro build (должна пройти без warnings)

# 4. Аудит контента + сайта
npm run audit:content  # python scripts/audit_content.py
npm run audit:site     # python scripts/audit_site.py

# 5. Security
npm run audit:security # npm audit --audit-level=moderate

# 6. ВСЁ вместе одной командой
npm run validate
```

Если хоть одна проверка **не прошла** — НЕ коммитить.

---

## 8. ДОБАВЛЕНИЕ НОВОЙ СТАТЬИ

1. Добавить статью в **`src/data/deepContents.ts`** (или туда, где у тебя контент).
2. Зарегистрировать в `src/data/library.ts` / `articles.ts`.
3. Если новая категория — обновить `src/data/categories.ts`.
4. Добавить размеры изображения в `src/data/articleImageDimensions.ts`.
5. Положить картинку в `public/images/` (или `src/assets/images/`).
6. Запустить `npm run build` — статья появится по адресу `/articles/<id>/`.
7. Прогнать `npm run validate`.

---

## 9. КРАСНЫЕ ФЛАГИ

| Если собираешься сделать | Почему стоп |
|---|---|
| «Создам новый компонент ArticleAuthor.tsx — модно» | См. §2. У `Header`/`Footer`/`ArticleView` уже всё есть. |
| «Импортирую deepContents в HomeApp для фичи Recent» | См. §3.1. КРАШ. Используй `library.ts` в Astro page. |
| «Уберу typeof window — выглядит лишним» | См. §3.2. Это для SSR build. КРАШ при сборке. |
| «Поменяю стили inline для скорости» | См. §4.2. Tailwind. |
| «Переключу dark на light по default» | **ЗАПРЕЩЕНО.** Тёмная тема — intentional brand design. §3.4 |
| «Добавлю светлую тему как основную, а тёмную как опцию» | **ЗАПРЕЩЕНО.** Это инвертирует бренд. §3.4 |
| «Уберу trimCache() — не нужен» | См. §3.3. Кеш будет расти бесконечно. |
| «Обновлю Astro с 6 до 7 — последняя версия» | НЕТ. Major-обновления = большие миграции, спроси. |
| «Заменю Fuse.js на современный поиск» | См. §3.6. Fuse настроен, не переделывай. |
| «Верну ClientRouter/ViewTransitions ради красивых переходов» | НЕТ. Уже давал зависания при переходе на статьи. §3.8 |
| «Верну список 115 статей на главную» | НЕТ. Для этого есть `/materials/`; на главной остаётся поиск. §3.9 |
| «Упрощу hover карточек: scale/brightness вместо blur-copy» | НЕТ. Reference-hover защищён. §3.9 |
| «Поправлю isList regex — нечитабельный» | См. §3.5. Уже сломали раз, не трогать. |
| «Сделаю prettier --write src/` — для красоты» | НЕТ. Diff = нечитаем. |
| «Поменяю Tailwind 4 синтаксис на CSS modules» | НЕТ. Архитектурный выбор. |

---

## 10. История этого документа

| Версия | Дата | Что |
|---|---|---|
| AGENTS-r5 | 2026-05-20 | Зафиксированы правила audit-hardening: React 18 types, 404 noindex/status, robots для `?q=`, lazy CommandPalette, JS-safe cursor fallback. |
| AGENTS-r4 | 2026-05-20 | Зафиксированы правила после index/materials superfix: `/materials/`, запрет ClientRouter, запрет портянки 115 статей на главной, reference-hover карточек/цифр/hero, репо-гигиена `.config`/`reference.html`. |
| AGENTS-r3 | 2026-05-19 | §3.4 усилен: тёмная тема — запрещённое для изменения требование; добавлен раздел CommandPalette (§11) с описанием багов и архитектуры поиска |
| AGENTS-r2 | 2026-05-17 | Зафиксированы правила: никаких source-дубликатов в корне, `src/utils/navigation.ts` + нативная MPA-навигация для внутренних переходов, curated audit Markdown можно коммитить. |
| AGENTS-r1 | 2026-05-17 | Создан на основе аудита (Astro 6 + React 18 + TS strict + Tailwind 4) |

---

> Этот проект — **самый строгий из трёх**. Он построен профессионально, и любая «смелая» правка может сломать сборку, кеш-инвалидацию, SEO, типы.
>
> Если правило кажется глупым — НЕ нарушай. Спроси владельца. Часто правила появились из-за конкретных багов, которые уже были и не должны повториться.

---

## 11. CommandPalette — архитектура и правила

`src/components/CommandPalette.tsx` — поиск Ctrl+K. Критически важные архитектурные решения:

### 11.1 Счётчики фильтр-чипов (sectionCounts)

`sectionCounts` **обязан считаться по полному набору**, а не по `baseResults`:
- Без запроса → итерация по всем `articles` (полный набор)
- С запросом → `fuse.search(trimmed)` **без лимита**

**Почему критично:** `baseResults` лимитируется (8 недавних или 30 интерливных), поэтому разделы с нулём в выборке отображались как `disabled`. Пользователь не мог выбрать «Техники», «Рецепты» и т.д.

❌ ЗАПРЕЩЕНО возвращать к старой логике:
```ts
// НЕПРАВИЛЬНО — sectionCounts только по baseResults:
const sectionCounts = useMemo(() => {
  for (const r of baseResults) { ... } // baseResults лимитирован!
}, [baseResults])
```

✅ ПРАВИЛЬНО:
```ts
const sectionCounts = useMemo(() => {
  if (query.trim()) {
    for (const r of fuse.search(trimmed)) { ... } // полный Fuse-скан
  } else {
    for (const a of articles) { ... } // все articles
  }
}, [articles, fuse, query])
```

### 11.2 Изображения разделов (SECTION_COVER)

`SECTION_COVER` — карта `sectionId → URL` для предпросмотра в правой панели:
- 4 дедикатные картинки в `/public/images/cat-*.webp`
- 2 — лучшие статьи раздела (histoire-culinaire, french-cuisine)

При добавлении новых разделов — добавить сюда же.

### 11.3 QuickAction.sectionId

`QuickAction` имеет поле `sectionId: string` для прямого доступа к разделу без разбора `id.replace('nav-', '')`. Всегда заполнять при создании.

