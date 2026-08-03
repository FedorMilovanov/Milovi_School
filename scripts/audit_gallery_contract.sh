#!/usr/bin/env bash
set -euo pipefail

TARGET="src/components/gallery/GalleryApp.tsx"
CSS="src/styles/global.css"
LUXURY_TEXT="src/components/LuxuryText.tsx"
HTML_FIXER="scripts/fix_generated_html.mjs"
PACKAGE_JSON="package.json"
COUNT=0

pass() {
  COUNT=$((COUNT + 1))
  printf '✓ [%02d] %s\n' "$COUNT" "$1"
}

fail() {
  COUNT=$((COUNT + 1))
  printf '✗ [%02d] %s\n' "$COUNT" "$1" >&2
  exit 1
}

contains() {
  local label="$1"
  local needle="$2"
  local file="${3:-$TARGET}"
  if grep -Fq -- "$needle" "$file"; then pass "$label"; else fail "$label"; fi
}

not_contains() {
  local label="$1"
  local needle="$2"
  local file="${3:-$TARGET}"
  if grep -Fq -- "$needle" "$file"; then fail "$label"; else pass "$label"; fi
}

regex() {
  local label="$1"
  local pattern="$2"
  local file="${3:-$TARGET}"
  if grep -Eq -- "$pattern" "$file"; then pass "$label"; else fail "$label"; fi
}

[[ -f "$TARGET" ]] && pass "GalleryApp source exists" || fail "GalleryApp source exists"
[[ -f "$CSS" ]] && pass "Global gallery CSS exists" || fail "Global gallery CSS exists"
[[ -f "$LUXURY_TEXT" ]] && pass "LuxuryText source exists" || fail "LuxuryText source exists"
[[ -f "$HTML_FIXER" ]] && pass "Generated HTML fixer exists" || fail "Generated HTML fixer exists"
[[ -f "$PACKAGE_JSON" ]] && pass "Package manifest exists" || fail "Package manifest exists"
contains "React ref support is imported" "useRef"
contains "Initial hover delay is intentional" "const INITIAL_HOVER_DELAY = 320"
contains "Card-switch delay is shorter" "const SWITCH_HOVER_DELAY = 120"
contains "Leave grace period is defined" "const LEAVE_CLOSE_DELAY = 260"
contains "Scroll-close threshold is defined" "const SCROLL_CLOSE_DISTANCE = 36"
contains "Preview requires hover-capable pointer" "(hover: hover) and (pointer: fine)"
contains "Preview requires full desktop width" "(min-width: 1024px)"
contains "Preview capability state is explicit" "const [canUsePreview, setCanUsePreview]"
contains "Preview dock state is explicit" "const [previewDock, setPreviewDock]"
contains "Cards expose stable gallery indexes" "data-gallery-index={index}"
contains "Dock lookup targets the active card" 'querySelector<HTMLElement>(`[data-gallery-index="${index}"]`)'
contains "Panel docks opposite left-side cards" "cardCenter < window.innerWidth / 2 ? 'right' : 'left'"
contains "Preview publishes its active dock" "data-dock={previewDock}"
contains "Preview width leaves neighbouring cards visible" "900px"
contains "Real pointer movement is tracked" "pointerHasMovedRef"
contains "Pointer timestamp starts inert" "Number.NEGATIVE_INFINITY"
contains "Hover timer ref exists" "hoverTimerRef"
contains "Leave timer ref exists" "leaveTimerRef"
contains "Dismissed card guard exists" "dismissedCardRef"
contains "Post-close hover lock exists" "hoverLockUntilRef"
contains "Preview hover continuity is tracked" "previewHoveredRef"
contains "All timers share cleanup" "clearPreviewTimers"
contains "Preview has one close function" "const closePreview = useCallback"
contains "Preview commit is centralized" "const commitPreview = useCallback"
contains "Preview scheduling is centralized" "const schedulePreview = useCallback"
contains "Preview close scheduling is centralized" "const scheduleClosePreview = useCallback"
contains "Mouse-only card entry guard exists" "event.pointerType !== 'mouse' || !canUsePreview"
contains "Stationary hydration entry is rejected" "pointerHasMovedRef.current"
contains "Dismissed card cannot reopen immediately" "dismissedCardRef.current === index"
contains "Real mouse movement releases dismissal" "dismissedCardRef.current = null"
contains "Wheel closes preview" "window.addEventListener('wheel', onWheel"
contains "Scroll closes preview" "window.addEventListener('scroll', onScroll"
contains "Window blur closes preview" "window.addEventListener('blur', onWindowBlur)"
contains "Tab visibility change closes preview" "document.addEventListener('visibilitychange', onVisibilityChange)"
contains "Escape closes preview" "event.key === 'Escape'"
contains "Right arrow navigates preview" "event.key === 'ArrowRight'"
contains "Left arrow navigates preview" "event.key === 'ArrowLeft'"
contains "Outside pointer down is handled" "document.addEventListener('pointerdown', onPointerDown)"
contains "Touch/narrow media change closes preview" "if (canUsePreview) return"
contains "Keyboard opening requires actual Tab intent" "keyboardNavigationRef.current"
contains "Keyboard opening respects preview capability" "!keyboardNavigationRef.current || !canUsePreview"
contains "Close button uses suppression guard" "onClick={() => closePreview(true)}"
contains "Card expansion state is accessibility-gated" "aria-expanded={canUsePreview ? isPreviewed : undefined}"
contains "Card control relation is accessibility-gated" "aria-controls={canUsePreview ? 'gallery-preview' : undefined}"
contains "Preview has stable DOM id" "id=\"gallery-preview\""
contains "Preview live region is polite" "aria-live=\"polite\""
contains "Preview live region is atomic" "aria-atomic=\"true\""
contains "Preview close control has accessible name" "aria-label=\"Свернуть предпросмотр\""
contains "Previous control has accessible name" "aria-label=\"Предыдущий материал\""
contains "Next control has accessible name" "aria-label=\"Следующий материал\""
contains "Normal article href is preserved" 'href={`/articles/${article.id}/`}'
contains "Modified-click navigation is preserved" "e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1"
contains "Preview is rendered only when capability is true" "previewArticle && canUsePreview"
contains "Preview content remounts on article change" "key={previewArticle.id}"
contains "Reduced-motion CSS disables panel animation" ".gallery-preview-card," "$CSS"
contains "Reduced-motion CSS disables image animation" ".gallery-preview-image { animation: none; }" "$CSS"
not_contains "Gallery images do not use sizes without srcset" "sizes=" "$TARGET"
contains "Luxury letters remain semantic text nodes" "<span className=\"luxury-letter\"" "$LUXURY_TEXT"
not_contains "Luxury wrapper avoids invalid aria-label on generic span" "'aria-label': children" "$LUXURY_TEXT"
not_contains "Luxury letters are not hidden from assistive technology" "aria-hidden=\"true\"" "$LUXURY_TEXT"
contains "Production build runs generated HTML fixer" "astro build && node scripts/fix_generated_html.mjs" "$PACKAGE_JSON"
contains "HTML fixer targets the Astro island style marker" "astro-island,astro-slot,astro-static-slot{display:contents}" "$HTML_FIXER"
contains "HTML fixer inserts the island style before head closes" "html.indexOf('</head>')" "$HTML_FIXER"
contains "HTML fixer inspects the generated body" "html.indexOf('<body')" "$HTML_FIXER"
contains "HTML fixer verifies no island style remains in body" "still remains in body" "$HTML_FIXER"
contains "HTML fixer refuses silent no-op output" "style marker was not found" "$HTML_FIXER"
contains "HTML fixer defines the forbidden NUL code point" "const INVALID_NUL = '\\u0000'" "$HTML_FIXER"
contains "HTML fixer strips invalid NUL code points" "replaceAll(INVALID_NUL, '')" "$HTML_FIXER"
contains "HTML fixer verifies no NUL remains" "Invalid NUL byte still remains" "$HTML_FIXER"
contains "HTML fixer reports removed NUL bytes" "removedNulBytes" "$HTML_FIXER"
contains "HTML fixer preserves non-document verification files" "skippedNonDocumentFiles" "$HTML_FIXER"
not_contains "Legacy immediate onMouseEnter opener is absent" "onMouseEnter"
not_contains "Legacy hasFinePointer state is absent" "hasFinePointer"
not_contains "Direct card-hover setPreviewIndex is absent" "onPointerEnter={() => setPreviewIndex"
regex "Pointer media listener is removed on cleanup" "mq\.removeEventListener\('change', handler\)"
regex "Wheel listener is removed on cleanup" "removeEventListener\('wheel', onWheel\)"
regex "Scroll listener is removed on cleanup" "removeEventListener\('scroll', onScroll\)"
regex "Visibility listener is removed on cleanup" "removeEventListener\('visibilitychange', onVisibilityChange\)"

if (( COUNT < 75 )); then
  fail "Audit executed at least 75 shell assertions"
fi

printf '\nGallery shell contract audit passed: %d checks.\n' "$COUNT"
