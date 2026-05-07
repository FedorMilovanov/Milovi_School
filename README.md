# Patisserie Russe — Astro SSG

**french.milovicake.ru** — библиотека о французской кондитерской школе.

---

## Архитектура

```
french.milovicake.ru/                              → index.html (главная)
french.milovicake.ru/articles/grolet-lemon-yuzu/  → index.html (статья)
... × 103 статьи
```

| Проблема | Решение |
|---|---|
| `deepContents.ts` (951 KB) в браузере | Только при сборке (build time) — в браузер не попадает |
| Яндекс не индексировал SPA | Каждая статья — готовый HTML с SEO meta, OG, JSON-LD |
| `window is not defined` при SSR | Все `localStorage` обёрнуты в `typeof window !== 'undefined'` |
| Навигация между статьями | URL-based: `window.location.href = /articles/${id}/` |

### Потоки данных

```
Сборка (build time):
  deepContents.ts (951 KB)
    └─▶ articles.ts → [id].astro → HTML-страницы

Браузер (runtime):
  HomeApp          ← libraryMeta  (без content, лёгкий)
  ArticlePageShell ← один article (~10 KB content)
  CommandPalette   ← libraryMeta  (поиск без content)
```

---

## Быстрый старт

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
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
│   └── articles/[id].astro      # 103 статичных страницы
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
