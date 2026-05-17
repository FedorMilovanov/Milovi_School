# Milovi School — Professional Fix Audit

**Дата:** 2026-05-17  
**База:** `b79b114`  
**Цель:** закрыть V2-баги профессионально, не ломая сборку, и вывести автоматический аудит в 0.

## Финальный результат проверки

- `astro check`: ✅ 0 errors / 0 warnings / 0 hints
- `eslint .`: ✅ 0 errors
- `npm audit --audit-level=moderate`: ✅ 0 vulnerabilities
- `astro build`: ✅ 119 static pages built
- `scripts/audit_content.py`: ✅ 115 articles have unique deep content entries
- `scripts/audit_site.py`: ✅ 0 errors / 0 warnings

## Зафиксированный site-audit

`audit/site-audit-report.md` обновлён и показывает:

```text
Errors: 0
Warnings: 0
Images verified: 140 files
Built article pages: 115
Sitemap checked: 118 URLs, 115 image entries
Article ids checked: 115, unique=115
```

## Исправления этой серии

### Навигация / переходы / CommandPalette

1. **#11 — `openArticle` делал полную перезагрузку**  
   Подключён Astro `ClientRouter`, добавлен `src/utils/navigation.ts`. Основные программные переходы теперь идут через `navigate()` с fallback на native navigation.

2. **#12 — клик по тегу уводил на `/?q=` через reload**  
   В `ArticleView` добавлен `onTagSearch`; на странице статьи тег открывает `CommandPalette` с готовым запросом без ухода со статьи.

3. **#66 — race condition после выбора категории в CommandPalette**  
   Выбор категории закрывает модалку, восстанавливает body scroll и только затем скроллит к архиву через два `requestAnimationFrame`.

### Layout / mobile / sticky UI

4. **#52/#58 — захардкоженный `top-[84px]`**  
   Добавлен дизайн-токен `--header-height: 84px`; мобильное меню и article progress теперь используют `top-[var(--header-height)]`.

5. **#53 — article grid со случайным `1fr` spacer**  
   Сетка статьи выровнена на симметричные боковые колонки: `15rem / content / 15rem`.

6. **#54 — `border-l` у CategorySection при одной compact-card**  
   Правая рамка теперь появляется только когда в секции достаточно материалов (`articles.length > 2`).

7. **#55/#51 — UpdateNotification через inline `<style>` и off-by-one breakpoint**  
   Компонент переписан на Tailwind-классы; breakpoint синхронизирован через `max-lg`, как у Toast/ScrollToTop.

### PWA / SEO / assets

8. **#37 — maskable icon использовала обычный logo.png**  
   Создана отдельная `public/images/logo-maskable.png` с safe-zone, `site.webmanifest` обновлён.

9. **#39 — мёртвый `og-default.svg`**  
   Удалён из `public/images`.

10. **Корневые дубликаты после upload**  
    Удалены дубликаты: `ArticleView.tsx`, `ArticlesGrid.tsx`, `CommandPalette.tsx`, `Header.tsx`, `HomeApp.tsx`, `StaticPageShell.tsx`, `about.astro`, `methodology.astro`, `global.css`, `storage.ts`.

11. **Markdown-картинки из deep content с внешними Unsplash URL**  
    Рендер статьи теперь не грузит удалённые markdown-изображения напрямую: внешние `![](...)` заменяются на локальный fallback категории. Это сохраняет layout и caption, но убирает сетевую зависимость.

### Reading UX / прогресс

12. **#36 — ContinueReading без миниатюр и progress bar 2px**  
    Карточки получили image thumbnail, overlay, категорийный бейдж; progress bar теперь `h-1`.

13. **#64 — readTime расходился с фактическим объёмом**  
    `readTime` пересчитан для 115 статей по фактическому `deepContents` (~220 слов/мин, минимум 2 минуты).

### Visual consistency

14. **#31 — прямой `font-['Cormorant_Garamond']`**  
    Заменено на системный `font-serif`.

15. **#32/#33 — слишком мелкий текст и чрезмерный tracking**  
    Снижены проблемные `tracking-[0.3em+]`, подняты мелкие labels в CommandPalette / MainCategories / labels.

16. **#50 — StatsBar `pb-0`**  
    Нижний padding уже исправлен на `pb-6` и перепроверен.

17. **#56 — ScrollReveal с большим offset**  
    Перепроверено: offset уже `20px`, не `40px`.

## Перепроверенные пункты, которые уже были закрыты до этой серии

- #1 smart-highlight не красит весь bold в синий.
- #2 дата публикации выводится в шапке статьи.
- #3 imageCredit выводится под hero при кастомном credit.
- #4 recipeData рендерится в UI.
- #5 search highlight контрастный.
- #6 TermTooltip Escape не уводит назад.
- #7 двухсловные ALL-CAPS заголовки попадают в TOC.
- #8 hero overlay ослаблен.
- #9 newsletter-заглушка удалена.
- #10 static pages обёрнуты в `StaticPageShell`.
- #13/#71 MobileBottomBar имеет «О нас» и ARIA tab roles.
- #17/#18/#19 CommandPalette chips/filter reset исправлены.
- #20 DashboardBento не предлагает продолжать 100% прочитанную статью.
- #21/#22 ScrollToTop / Toast используют `max-lg` и не конфликтуют на 768–1023px.
- #23 ScrollReveal имеет безопасный viewport amount и не остаётся opacity:0.
- #40 mobile TOC имеет `max-h-[70vh] overflow-y-auto`.
- #41 `fetchPriority="high"` у FeaturedCard только для первого элемента.
- #42 ImageWithFade fallback использует CSS variables.
- #43/#44 Mogador использует `localImages.mogador`; Showcase не тянет портрет для Mogador.
- #45 DashboardBento считает минуты дробно и округляет только при выводе.
- #47 даты парсятся через `T12:00:00`.
- #48 CommandPalette `wideEnough` инициализируется от `window.innerWidth`.
- #49 `histoire-culinaire` не падает в portrait fallback.
- #62 `techniques` / `recipes` активируют «Архив».
- #67 ContinueReading имеет стабильный tie-breaker по `article.id`.
- #70 автор есть в preview-панели CommandPalette.

## Важное уточнение по #63/#68

Пункт про «14 мёртвых ключей `deepContents`» — ложноположительный для текущего кода. Причина: часть объектов `articles.ts` многострочная, простые regex-проверки пропускали эти `id`. Официальный `scripts/audit_content.py` подтверждает:

```text
OK: 115 articles have unique deep content entries.
```

Сборка также генерирует 115 article pages.

## Остаток после этой серии

Автоматический аудит: **0 ошибок / 0 предупреждений**.  
Оставшиеся задачи — не баги аудита, а следующий уровень качества:

1. Добавить Playwright smoke-test: home → command palette → tag → article → back.
2. Добавить axe/accessibility pass в CI.
3. Вынести пересчёт `readTime` в отдельный build-time script, чтобы не править руками.
4. Сделать ручной visual QA после деплоя на 390px / 768px / 1024px / desktop.
