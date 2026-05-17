# AGENTS.md — Milovi School / Patisserie Russe (french.milovicake.ru)

> **Если ты ИИ-агент — этот файл обязателен к прочтению ДО любого изменения кода.**
>
> Этот проект — **Astro SSG + React/TypeScript**. Стандарты выше, чем у статических сайтов: строгий TypeScript, ESLint, Tailwind 4, SSR-safe код. Тут «смелые» правки разрушают сборку.

**Владелец:** Виктория Милованова (бренд Milovi)
**Производственный сайт:** https://french.milovicake.ru
**Дата документа:** 2026-05-17 | **Версия:** AGENTS-r1

---

## 0. TLDR — что СРАЗУ нельзя делать

1. ❌ Создавать новые компоненты, страницы, hooks, utils без явного запроса.
2. ❌ Менять `astro.config.mjs`, `tsconfig.json`, `eslint.config.js` без согласия.
3. ❌ Обновлять зависимости в `package.json` (Astro / React / Tailwind / Fuse).
4. ❌ Импортировать `deepContents.ts` в **client islands** (это 1.1 MB → в браузер не должен попадать).
5. ❌ Использовать `localStorage` / `window` / `document` **без** обёртки `typeof window !== 'undefined'`.
6. ❌ Менять Tailwind utility-классы на inline `style=` или CSS-модули.
7. ❌ Удалять Service Worker (`public/sw.js`) или менять `__BUILD_HASH__` placeholder.
8. ❌ Менять тёмную тему как «default» — она задумана так (intentional design).
9. ✅ После любой правки — `npm run check && npm run lint && npm run build`.
10. ✅ Перед коммитом — `npm run validate` (полный пакет проверок).

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
│   │   ├── index.astro             ← главная (libraryMeta, без content)
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
│   │   ├── ShowcaseSlider.tsx, ImageWithFade.tsx
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
│   │   ├── library.ts              ← полный набор статей (с content!)
│   │   ├── deepContents.ts         ← ⚠️ ~1.1 MB! ТОЛЬКО build-time!
│   │   ├── categories.ts           ← список категорий
│   │   ├── french-terms.ts         ← словарь терминов
│   │   └── articleImageDimensions.ts
│   │
│   ├── utils/
│   │   ├── storage.ts              ← SSR-safe localStorage (ОБЯЗАТЕЛЬНО использовать)
│   │   ├── search.ts               ← Fuse конфиг (вынесен из HomeApp)
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
│   ├── favicon.svg, images/        ← (логотипы категорий, OG-картинки)
│   └── google*.html, yandex*.html  ← верификации поисковиков
│
├── scripts/                        ← Python build-time скрипты
│   ├── audit_site.py               ← проверка dist/
│   ├── audit_content.py            ← проверка контента
│   └── optimize-hero.ps1
│
└── audit/site-audit-report.md      ← последний отчёт аудита (обновляется CI)
```

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

### 3.4 Тёмная тема — основная (intentional design)

Тёмная тема — **не «опция», а основное оформление** проекта (премиальность французской кондитерской). Не делать её «равной» светлой и не переключать default.

В `global.css`:
```css
:root {
  /* ОСНОВНЫЕ значения = ТЁМНАЯ тема */
  --bg: #0a0a0a;
  /* ... */
}

@media (prefers-color-scheme: light) {
  :root { /* светлая, только если пользователь явно выбрал */ }
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

---

## 4. STYLING — Tailwind 4

### 4.1 Один CSS-файл

Весь глобальный CSS — в **`src/styles/global.css`** (514 строк). Не создавать новых `.css` модулей.

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
| «Переключу dark на light по default» | См. §3.4. Это intentional. |
| «Уберу trimCache() — не нужен» | См. §3.3. Кеш будет расти бесконечно. |
| «Обновлю Astro с 6 до 7 — последняя версия» | НЕТ. Major-обновления = большие миграции, спроси. |
| «Заменю Fuse.js на современный поиск» | См. §3.6. Fuse настроен, не переделывай. |
| «Поправлю isList regex — нечитабельный» | См. §3.5. Уже сломали раз, не трогать. |
| «Сделаю prettier --write src/` — для красоты» | НЕТ. Diff = нечитаем. |
| «Поменяю Tailwind 4 синтаксис на CSS modules» | НЕТ. Архитектурный выбор. |

---

## 10. История этого документа

| Версия | Дата | Что |
|---|---|---|
| AGENTS-r1 | 2026-05-17 | Создан на основе аудита (Astro 6 + React 18 + TS strict + Tailwind 4) |

---

> Этот проект — **самый строгий из трёх**. Он построен профессионально, и любая «смелая» правка может сломать сборку, кеш-инвалидацию, SEO, типы.
>
> Если правило кажется глупым — НЕ нарушай. Спроси владельца. Часто правила появились из-за конкретных багов, которые уже были и не должны повториться.
