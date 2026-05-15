# Audit patch — round 2 (2026-05-16)

This document lists every fix applied on top of the previous audit pass.
Every change is **functional and non-cosmetic**: real bug, real risk reduction.
No silent code-quality nits or formatting churn.

---

## Critical fixes

### 1. `goBack()` no longer dumps users on the home page after JS navigation
**File:** `src/components/ArticlePageShell.tsx`

The old check `document.referrer.includes(window.location.hostname)` returns
`false` when the user navigates between articles via `window.location.href`
on the same origin (the browser doesn't always set a Referer for
same-origin SPA-style navigation). Pressing "Назад" then sent the user to
`/` instead of the previous article.

Fix: tag the current history entry with a `miloviInternal` state token on
mount via `history.replaceState`. `goBack()` checks for that token and
falls back to `/` only when it really is the cold-load entry.

### 2. Skip-to-content link for keyboard / screen-reader users
**Files:** `src/layouts/BaseLayout.astro`, `src/styles/global.css`,
`src/components/HomeApp.tsx`, `src/components/ArticlePageShell.tsx`

Added a single `<a href="#main-content">Перейти к содержимому</a>` rendered
in `BaseLayout` for every page. It's `position: absolute; top: -100px;` by
default and slides in on `:focus`. Both `HomeApp` (`<main id="main-content">`)
and `ArticlePageShell` (`<div id="main-content">`) expose the matching anchor.

### 3. Light-theme accent color now passes WCAG AA contrast
**File:** `src/styles/global.css`

`#b8860b` on `#fcfaf8` produced a 3.5:1 contrast ratio — below the WCAG AA
4.5:1 threshold for normal text. Tag chips, links, and badges using
`var(--text-accent)` were failing accessibility audits.

Fix: split the variable.
- `--text-accent: #8c620a` — text usage, ratio ≈ 5.4:1, AA pass
- `--accent-gold-hi: #b8860b` — pure-decorative gold for borders, scrollbars,
  glow effects where contrast is irrelevant

Dark theme already passed (`#e8c670` on `#10100f` ≈ 8:1) — added the same
alias for symmetry.

### 4. Service worker no longer pollutes cache in dev
**Files:** `public/sw.js`, `astro.config.mjs`, `src/layouts/BaseLayout.astro`

In `npm run dev` the `__BUILD_HASH__` placeholder isn't substituted (the
integration only runs on `astro:build:done`). If the SW registered, its
caches were keyed on the literal string and the `activate` cleanup never
matched them, so they accumulated forever across `git switch` boundaries.

Fixes:
- `BaseLayout.astro` skips SW registration on `localhost`/`127.0.0.1`/`0.0.0.0`
- `astro.config.mjs` uses `replaceAll('__BUILD_HASH__', …)` so the
  placeholder is also removed from the comment that documents it
- SW now `await`s `cache.put()` *before* `trimCache()` runs (ordering bug)
- `cache.delete(keys[0])` recursive call replaced with a bounded `for` loop
- SW cleanup filter is now `startsWith('patisserie-')` so it never deletes
  unrelated origin caches by accident

---

## Mobile UX fixes

### 5. ShowcaseSlider drag detection now works on touch
**File:** `src/components/ShowcaseSlider.tsx`

The slider only listened to `mouse*` events. On phones, the `drag.moved`
flag was never set, so the click-capture suppressor never fired and a
swipe could accidentally navigate to a category. Added matching
`onTouchStart`/`onTouchMove`/`onTouchEnd`/`onTouchCancel` handlers that
mirror the mouse logic.

### 6. Mobile bottom-bar visibility uses a shared scroll store
**Files:** `src/hooks/useScrollDirection.ts` (new), `src/components/HomeApp.tsx`

`HomeApp` registered its OWN `scroll` listener on top of `useScrollProgress`'
already-singleton listener. Created `useChromeVisible()` that reuses the
same passive + rAF-throttled pattern, attaches a single shared listener
only while at least one consumer is mounted, and tears it down cleanly
when the last unsubscribes.

### 7. `theme-color` meta now updates dynamically with theme toggle
**Files:** `src/layouts/BaseLayout.astro`, `src/components/HomeApp.tsx`,
`src/components/ArticlePageShell.tsx`

The two static `<meta name="theme-color" media="...">` tags were ignored
by Chrome on Android when the user toggled themes via JS (the browser
re-evaluates the media query only on full reload). Replaced with a
single `<meta id="theme-color-meta">` that the inline pre-paint script
seeds correctly and both island shells update on every theme change.

---

## Accessibility fixes

### 8. ARIA improvements
- **`MobileBottomBar`**: `<motion.nav aria-label="Основная навигация">` instead
  of plain `<motion.div>`; SVG icons get `aria-hidden="true" focusable="false"`;
  every button has an explicit `aria-label` (search button gains "Открыть поиск").
- **`ArticleActions`**: bookmark button now has `aria-pressed={saved}` so screen
  readers announce the toggle state.
- **`TermTooltip`** (in `ArticleView`): added `aria-expanded`, `aria-haspopup`;
  outside-click + Escape dismissal via document-level listeners (was relying
  on `onBlur` alone, which closed prematurely if the user tabbed into the
  tooltip itself).

### 9. `slugify` and `isSectionTitle` handle French diacritics
**File:** `src/components/ArticleView.tsx`

`crème brûlée` and `PÂTE À CHOUX` now generate predictable, ASCII-only
heading IDs via Unicode NFD normalisation followed by combining-mark
stripping. Eliminates one whole class of "Table of Contents link goes
nowhere" bugs for French-titled sections.

---

## Performance / quality

### 10. CommandPalette quick-action preview panel
**File:** `src/components/CommandPalette.tsx`

When a Quick Action (Техники / Рецепты / chef cards) was highlighted on a
wide screen, the right-hand preview panel rendered nothing — leaving an
awkward empty 260 px column. Added a dedicated quick-action preview
(icon, label, sublabel, "Открыть" CTA) so the panel stays informative.

### 11. Hero marquee uses 2 copies, not 4
**File:** `src/components/Hero.tsx`

The CSS keyframe shifts the strip by `translateX(-50%)`; with two copies
the second's start aligns where the first's started, producing a
perfectly seamless loop. Four copies meant ~24 wasted DOM nodes per
render.

### 12. Vite chunk-size warning back to default 500 KB
**File:** `astro.config.mjs`

The previous bumped 600 KB silenced legitimate weight-creep warnings.
Current largest chunk is `vendor.js` ≈ 236 KB — comfortably under.

### 13. Footer year SSG-safe
**File:** `src/components/Footer.tsx`

Initial value is now `() => new Date().getFullYear()` so the SSG render
already shows the build-time year. Effect still updates on the client
in the rare case where the build server has drifted.

---

## Verification

```
npx astro check  → 0 errors / 0 warnings / 0 hints (48 files)
npx astro build  → 119 pages built in ~6 s, 0 errors
                   image sitemap: 115 article URLs
                   SW cache:      v<timestamp>  (single placeholder replaced)
```

Bundle sizes (gzip not measured here):
```
vendor.js          236 KB
HomeApp.js          60 KB
ScrollToTop.js      52 KB
framer-motion.js    40 KB
ArticlePageShell.js 40 KB
search.js (fuse)    24 KB
```

All audit issues from round 1 either fixed (above) or formally accepted
as non-issues after re-reading the source:

- `<a>` tags in ContinueReading **do** carry `href` — correct semantics,
  no fix needed.
- `LINK_REGEX` global flag is only used in `String.prototype.split`,
  which resets `lastIndex` — no statefulness bug.
- `useState(QUOTES[0])` declared after a `useEffect` in `DashboardBento`
  is unconventional but still respects the Rules of Hooks (call order is
  identical on every render). Left alone to keep the diff focused.
