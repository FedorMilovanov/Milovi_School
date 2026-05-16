# Milovi School — финальная перепроверка и исправления

Дата: 2026-05-16

## Исправлено

1. **Безопасная кнопка «Назад» в статье**
   - `src/components/ArticlePageShell.tsx`
   - Прямой заход из Google/мессенджеров/внешних сайтов больше не вызывает `history.back()` наружу.
   - Browser back используется только если `document.referrer` — same-origin.

2. **Семантика страниц статей / accessibility**
   - `src/components/ArticleView.tsx`
   - `src/pages/404.astro`
   - Убран вложенный `<main>` в статье; 404 также получил корректный `<main id="main-content">`.

3. **Hydration mismatch fixes**
   - `src/components/HomeApp.tsx`
   - `src/components/ArticlePageShell.tsx`
   - `src/components/ArticleView.tsx`
   - Тема и предпочтения чтения теперь не дают расхождения SSR/первого client render. Реальные значения синхронизируются после mount; pre-paint CSS по-прежнему работает до первого кадра.

4. **CI/CD и Node toolchain**
   - `.nvmrc`, `package.json`, `package-lock.json`, `.github/workflows/deploy.yml`
   - Node закреплён на `22.13.0+`, чтобы убрать EBADENGINE warning от актуального ESLint toolchain.
   - GitHub Actions теперь запускает `lint` и `audit:content` до production build.

5. **Аудит сайта усилен**
   - `scripts/audit_site.py`
   - Добавлена проверка ровно одного `<main>` на HTML-страницу и отсутствие вложенного main landmark.
   - Отчёт больше не печатается дважды.

6. **Документация обновлена**
   - `README.md`
   - `AUDIT_PHASES_PROFESSIONAL.md`

## Проверка

Запущено на Node.js `v22.13.0`:

```bash
npm ci
npm run lint
npm run check
npx tsc --noEmit --pretty false
npm run audit:content
npm run audit:security
npm run build
npm run audit:site
npm run validate
```

Итог:

- `astro check`: 0 errors / 0 warnings / 0 hints
- `npm audit`: 0 vulnerabilities
- `audit:content`: OK, 115 статей имеют уникальный deep content
- `audit:site`: 0 errors / 0 warnings
- build: 119 страниц, 115 article pages

Картинки в архив не добавлялись.
