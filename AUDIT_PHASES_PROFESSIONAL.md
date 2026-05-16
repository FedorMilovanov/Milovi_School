# Milovi School — professional remediation plan

Дата: 2026-05-16

## Executive summary

Цель исправлений — не «подкрутить функции», а убрать классы дефектов: несогласованное состояние гидратации, незащищённые глобальные обработчики, дрейф поисковой конфигурации, отсутствие автоматического контроля контента и слабые PWA/SEO/A11y гарантии.

В этом архиве реализованы фазы 1–4: фундамент качества, критическая навигация/offline, производительность/Core Web Vitals, доступность и UX-polish.

## Реестр подтверждённых проблем и статус

### Закрыто в фазах 1–2

- JSON-LD XSS: `JSON.stringify()` теперь проходит через `safeJsonLd(...).replace(/</g, '\\u003c')`.
- DashboardBento hooks: `quote` state поднят к остальным state hooks.
- Service Worker navigate fallback: `caches.match('/')` теперь awaited.
- `goBack()` на статье: больше не доверяет `history.length` и не выбрасывает пользователя на внешний сайт.
- CommandPalette stale closure: `query` включён в deps; Escape сначала очищает поиск.
- Поиск: единая `ARTICLE_FUSE_OPTIONS` в `src/utils/search.ts`.
- Content integrity: добавлен `scripts/audit_content.py`, который не даст снова отдать generic fallback вместо статьи.

### Закрыто в фазах 3–4

- `useScrollProgress`: настоящий singleton через `Set` подписчиков, один scroll listener и один resize listener, rAF-throttle.
- LCP: hero image и featured cards грузятся `loading="eager"` / `fetchPriority="high"`.
- CLS/FOUC: BaseLayout pre-paint script учитывает `prefers-color-scheme`, `pref-large-text` и `pref-focus-mode` до первого рендера.
- `ArticleView`: мобильный дубль progress bar убран (`hidden lg:block` для верхнего бара).
- `TermTooltip`: Escape останавливает событие, тултип не конфликтует с ArticleView; исправлены ARIA mismatch, скрытые тултипы и id-коллизии.
- ErrorBoundary: сервисные компоненты (`UpdateNotification`, `ToastContainer`, `ScrollProgress`, `ScrollToTop`) находятся внутри boundary.
- A11y: `ArticlePageShell` использует `<main id="main-content">`.
- Typography: установлен `@tailwindcss/typography` и подключён через `@plugin`.
- Image UX: убран `title={alt}` из `ImageWithFade` и CommandPalette thumbnails.
- ContinueReading: визуальная ширина бара теперь соответствует реальному проценту.
- Reading streak: защита от NaN-коррупции.
- Toast: fallback для браузеров без `crypto.randomUUID()`.
- Manifest: убран принудительный `orientation`, исправлен dark splash background, добавлена настоящая `logo-192.png`.
- SW cache busting: build hash теперь включает миллисекунды и UUID-фрагмент, а не только секунды.

### Закрыто в финальной перепроверке 2026-05-16

- Безопасная навигация «Назад» на странице статьи: прямой заход с внешнего сайта больше не вызывает `history.back()` наружу.
- Убран вложенный `<main>` на страницах статей; статический аудит теперь проверяет ровно один main landmark на HTML-страницу.
- Исправлены потенциальные hydration mismatches для темы и предпочтений чтения (`theme`, `largeText`, `focusMode`).
- CI/CD использует Node 22.13.0 и запускает `lint` + `audit:content` до production build.
- `audit_site.py` больше не печатает отчёт дважды.

## Контентный контроль

В текущем состоянии репозитория `deepContents.ts` содержит 115 ключей на 115 статей. Скрипт `npm run audit:content` проверяет:

1. каждая статья из `articles.ts` имеет соответствующий deep content key;
2. нет orphan-записей в `deepContents.ts`;
3. нет повторяющихся generic fallback markers;
4. нет подозрительно коротких тел статей.

Это предотвращает возврат SEO-катастрофы, когда карточка статьи есть, а внутри одинаковая заглушка.

## Дальнейшая профессиональная дорожная карта

### Phase 5 — CI/CD hardening

- GitHub Actions: `npm ci`, `npm run lint`, `npm run check`, `npm run audit:content`, `npm run build`, `npm run audit:site`.
- Node pinning: `.nvmrc` / `.node-version` с `22.13+`.
- Lighthouse CI по preview URL: LCP, CLS, accessibility, SEO budgets.

### Phase 6 — Content platform

- Вынести статьи из TS-массива в content collections/MDX.
- Для каждого материала: `title`, `description`, `imageAlt`, `sources`, `updatedAt`, `factCheckStatus`.
- Автоматический content diff audit: если article id добавлен без body — PR блокируется.

### Phase 7 — Observability

- `componentDidCatch` в ErrorBoundary с production logger hook.
- SW registration/update failures — `console.warn` сейчас; дальше подключить real logging endpoint.
- Web Vitals reporting (`web-vitals`) для LCP/CLS/INP.

### Phase 8 — Search quality

- Синонимы и транслитерация: ganache/ганаш, macaron/макарон, feuilletage/слоение.
- Категории и chef aliases в отдельном search index.
- Snapshot-тесты релевантности для топовых запросов.

## Верификация в этом окружении

- `npm run lint` — проходит.
- `npx tsc --noEmit --pretty false` — проходит.
- `python3 scripts/audit_content.py` — проходит.
- В финальной перепроверке использован Node.js v22.13.0: `npm ci`, `npm run lint`, `npm run check`, `npx tsc --noEmit --pretty false`, `npm run audit:content`, `npm run build`, `npm run audit:site` — проходят.
