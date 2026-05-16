# Milovi School — Аудит и хирургические исправления

**Дата:** 2026-05-16  
**Файлов исправлено:** 5  
**Характер:** только функциональные исправления, без косметики

---

## 🔴 БАГ №1 (Critical) — ArticleView.tsx — разваленная вёрстка 3-колоночного grid

**Симптом:** На странице статьи FAQ-секция отображалась вне `.article-body`, а правый спейсер оказывался вне grid-контейнера. Блок `.drop-cap` закрывался неправильно из-за того, что `<div className="space-y-7 min-w-0 article-body">` и `<div className="drop-cap relative">` были на одной строке — единственный `</div>` закрывал оба.

**Исправление:** Разделил открытие article-body и drop-cap на разные строки. Drop-cap закрывается ДО FAQ. FAQ находится ВНУТРИ article-body. Article-body закрывается отдельно. Spacer и grid закрываются корректно. Убрана лишняя «сиротская» `</div>`.

---

## 🟠 БАГ №2 (High) — MainCategories.tsx — нечитаемый текст на тёмном overlay

**Симптом:** Название категории (`text-stone-950` = #151311) на почти чёрном градиентном overlay (`rgba(10,8,7,0.82)`). NEW badge на тёмно-золотом фоне. В обеих темах текст практически неразличим.

**Исправление:** Заменил `text-stone-950` → `text-white` на обоих элементах. Белый текст контрастен в обеих темах.

---

## 🟡 БАГ №3 (Medium) — ShowcaseSlider.tsx — флаг moved не сбрасывался

**Симптом:** После touch-свайпа на мобильном устройстве `drag.current.moved` оставался `true`. При следующем mouse-клике `onClickCapture` ошибочно подавлял нажатие на карточку.

**Исправление:** Добавлен `drag.current.moved = false` в `stopDrag()`.

---

## 🔵 БАГ №4 (Medium) — Hero.tsx — hydration mismatch (React warn)

**Симптом:** `useState(() => typeof window !== 'undefined' && window.innerWidth < 768)` на сервере возвращал `false`, на клиенте на мобильных — `true`. React hydration warning.

**Исправление:** `useState(false)` (SSR-safe). Реальное значение синхронизируется в `useEffect`.

---

## 🔵 БАГ №5 (Medium) — CommandPalette.tsx — hydration mismatch (React warn)

**Симптом:** `useState(() => typeof window !== 'undefined' ? window.innerWidth >= 640 : true)` вызывал hydration mismatch на мобильных.

**Исправление:** `useState(true)` (SSR-safe). Реальное значение устанавливается в `useEffect`.

---

## 🟣 БАГ №6 (Low-Medium) — ArticleView.tsx — ненадёжная навигация по тегам

**Симптом:** Клик по тегу писал `pending-search` в `sessionStorage` и вызывал `onBack()`. `onBack()` мог выполнить `history.back()` на другую статью (не на главную) — поиск терялся.

**Исправление:** Теперь `window.location.href = '/?q=' + encodeURIComponent(tag)`. Домашняя страница читает `?q=` из URL, sessionStorage больше не используется для этой цели.

---

## ✅ Проверка структуры

```
ArticleView.tsx:     Grid OPEN → aside / article-body / spacer → Grid CLOSE ✓
MainCategories.tsx:  2 text colors `text-stone-950` → `text-white`     ✓
ShowcaseSlider.tsx:  stopDrag сбрасывает `moved`                       ✓
Hero.tsx:            `useState(false)` SSR-safe, sync в useEffect       ✓
CommandPalette.tsx:  `useState(true)` SSR-safe, sync в useEffect        ✓
```
