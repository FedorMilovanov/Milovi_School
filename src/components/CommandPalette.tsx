// CommandPalette v4.0 Final
// Architecture decisions:
//  [IMG] useEffect + img.decode() with tokens → no blocking, cached images show instantly,
//        stale onLoad/onError never corrupt state.
//  [PRV] mode="wait" inside static container (320px) → single DOM node at a time,
//        eliminates layout shift and double-text artifact completely.
//  [HVR] Debounced setActiveIndex (45ms) → reduces re-renders during fast mouse sweeps.
//  [SCR] RAF-throttled visibility-based scrollIntoView('auto') → no layout thrashing.
//  [PFC] Preload current + adjacent images → instant crossfades in preview.
//  [CAT] Static O(1) category lookup map → zero repeated find() cost.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Fuse, { type FuseResultMatch } from 'fuse.js'
import type { ArticleClientMeta } from '../data/types'
import { categories, NON_CHEF_CATEGORY_IDS } from '../data/categories'
import { pluralRu, MATERIAL, RESULT } from '../utils/plural'
import { safeGetItem } from '../utils/storage'
import { highlightWithMatches } from '../utils/highlight'
import { ARTICLE_FUSE_OPTIONS } from '../utils/search'

/* ═════════════════════════════════════════
   Static data – computed once
   ═════════════════════════════════════════ */
const categoryById = new Map(categories.map(c => [c.id, c]))

/* ═════════════════════════════════════════
   Types
   ═════════════════════════════════════════ */
interface CommandPaletteProps {
  open: boolean
  articles: ArticleClientMeta[]
  onClose: () => void
  onOpenArticle: (article: ArticleClientMeta) => void
  onSelectCategory?: (id: string) => void
  initialQuery?: string
}

interface ArticleResult {
  item: ArticleClientMeta
  matches?: ReadonlyArray<FuseResultMatch>
  pct?: number
}

interface QuickAction {
  id: string
  label: string
  sublabel?: string
  icon: string
  action: () => void
}

/* ═════════════════════════════════════════
   Small pure components
   ═════════════════════════════════════════ */
function H({ text, matches, field }: {
  text: string
  matches: ReadonlyArray<FuseResultMatch> | undefined
  field: string
}) {
  return <>{highlightWithMatches(text, matches, field)}</>
}

function SectionLabel({ children, inline }: { children: ReactNode; inline?: boolean }) {
  if (inline)
    return (
      <span className="font-mono text-[9.5px] uppercase tracking-[0.18em]" style={{ color: 'var(--cp-text-mid)' }}>
        {children}
      </span>
    )
  return (
    <div className="px-5 pb-1 pt-3">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.18em]" style={{ color: 'var(--cp-text-mid)' }}>
        {children}
      </span>
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--cp-divider)', margin: '2px 20px 2px' }} />
}

function ArrowRight() {
  return (
    <svg className="h-3 w-3 shrink-0" style={{ color: 'var(--cp-text-mid)' }}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  )
}

/* ═════════════════════════════════════════
   ArticleImage – robust image loading
   ═════════════════════════════════════════
   Key insight: We do NOT use useLayoutEffect to block the render thread.
   Instead we use a token system + src guard so that rapid src changes
   cannot cause stale callbacks to corrupt state.
   For already-cached images (complete=true) we call decode() which resolves
   synchronously or nearly-so, letting us set loaded=true immediately.
   ═════════════════════════════════════════ */
function ArticleImage({
  src,
  alt,
  style,
  fadeInDuration = 350,
  loading = 'lazy',
}: {
  src: string
  alt: string
  style?: CSSProperties
  fadeInDuration?: number
  loading?: 'lazy' | 'eager' | 'auto'
}) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  const imgRef = useRef<HTMLImageElement>(null)
  // Guard against stale callbacks when src changes rapidly
  const srcRef = useRef(src)
  // Token invalidates any pending async work when src changes
  const tokenRef = useRef(0)

  // Keep srcRef up-to-date (for callback guards)
  useEffect(() => { srcRef.current = src }, [src])

  // Main effect: reset state + handle cache
  useEffect(() => {
    // Invalidate all previous async work
    const tok = ++tokenRef.current
    const currentSrc = src

    setLoaded(false)
    setErrored(false)

    const img = imgRef.current
    if (!img) return

    // If image is already fully available (from bfcache / preload / eager)
    if (img.complete) {
      // Decode ensures the browser has finished decompressing;
      // for small/cached images this is effectively synchronous.
      img
        .decode()
        .then(() => {
          // Check validity after potential microtask yield
          if (tok !== tokenRef.current) return
          if (srcRef.current !== currentSrc) return
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            setLoaded(true)
          } else {
            setErrored(true)
          }
        })
        .catch(() => {
          if (tok !== tokenRef.current) return
          if (srcRef.current !== currentSrc) return
          setErrored(true)
          setLoaded(false)
        })

      // Important: still let normal load/error handlers run as fallback
      // in case decode resolved but image was replaced before our checks.
      // The callbacks below also guard against staleness.
    }
    // If not complete yet, load/error handlers will fire normally later.
  }, [src])

  const handleLoad = useCallback(() => {
    // Ignore events belonging to a previous src instance
    if (srcRef.current !== src) return
    setLoaded(true)
    setErrored(false)
  }, [src])

  const handleError = useCallback(() => {
    if (srcRef.current !== src) return
    setErrored(true)
    setLoaded(false)
  }, [src])

  return (
    <div style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {!loaded && !errored && (
        <div className="cp-skeleton" style={{ position: 'absolute', inset: 0 }} aria-hidden="true" />
      )}
      {!errored && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: loaded ? 1 : 0,
            transition: `opacity ${fadeInDuration}ms ease`,
          }}
        />
      )}
      {errored && (
        <div
          role="img"
          aria-label="Изображение недоступно"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--cp-chip)',
            fontSize: 16,
            color: 'var(--cp-text-mid)',
          }}
        >
          ✦
        </div>
      )}
    </div>
  )
}

/* ═════════════════════════════════════════
   Main Component
   ═════════════════════════════════════════ */
export default function CommandPalette({
  open,
  articles,
  onClose,
  onOpenArticle,
  onSelectCategory,
  initialQuery = '',
}: CommandPaletteProps) {
  /* ── State ── */
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [filterCat, setFilterCat] = useState<string | null>(null)
  const [wideEnough, setWideEnough] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 768,
  )

  /* ── Refs ── */
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldReduce = useReducedMotion()

  // Hover debounce timer
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Scroll throttle via requestAnimationFrame
  const scrollRafRef = useRef<number | null>(null)
  // Focus restoration target
  const prevFocusRef = useRef<HTMLElement | null>(null)

  /* ── Responsive ── */
  useEffect(() => {
    const handler = () => setWideEnough(window.innerWidth >= 768)
    handler()
    window.addEventListener('resize', handler, { passive: true })
    return () => window.removeEventListener('resize', handler)
  }, [])

  /* ── Open / Reset ── */
  useEffect(() => {
    if (!open) return

    // Cleanup scheduled hovers
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)

    setQuery(initialQuery)
    setActiveIndex(0)
    setFilterCat(null)

    // Save current focus for restoration on close
    prevFocusRef.current = document.activeElement as HTMLElement | null

    // Async focus (avoids blocking paint of palette entrance animation)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [open, initialQuery])

  // Restore focus on close (including unmount)
  useEffect(() => {
    if (!open) {
      prevFocusRef.current?.focus()
    }
  }, [open])

  /* ── Scroll lock ── */
  useEffect(() => {
    if (!open) return
    const w = window.innerWidth - document.documentElement.clientWidth
    const prevO = document.body.style.overflow
    const prevP = document.body.style.paddingRight
    document.body.style.overflow = 'hidden'
    if (w > 0) document.body.style.paddingRight = `${w}px`
    return () => {
      document.body.style.overflow = prevO
      document.body.style.paddingRight = prevP
    }
  }, [open])

  /* ── Fuse instance (stable) ── */
  const fuse = useMemo(
    () => new Fuse<ArticleClientMeta>(articles, ARTICLE_FUSE_OPTIONS),
    [articles],
  )

  /* ── Recent articles (recomputed on open) ── */
  const recentArticles = useMemo<Array<{ article: ArticleClientMeta; pct: number }>>(
    () =>
      articles
        .map(a => ({
          article: a,
          ts: Number(safeGetItem(`article-last-read:${a.id}`) ?? 0),
          pct: Number(safeGetItem(`article-progress-pct:${a.id}`) ?? 0),
        }))
        .filter(x => x.ts > 0 || x.pct > 0)
        .sort((a, b) => b.ts - a.ts)
        .slice(0, 5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [articles, open],
  )

  /* ── Quick actions ── */
  const quickActions: QuickAction[] = useMemo(() => {
    if (!onSelectCategory) return []
    const chefCats = categories.filter(c => !NON_CHEF_CATEGORY_IDS.has(c.id))
    return [
      {
        id: 'nav-techniques',
        label: 'Техники',
        sublabel: 'Все техники кондитерского искусства',
        icon: 'TK',
        action: () => { onSelectCategory('techniques'); onClose() },
      },
      {
        id: 'nav-recipes',
        label: 'Рецепты',
        sublabel: 'Практические карты сборки',
        icon: 'RC',
        action: () => { onSelectCategory('recipes'); onClose() },
      },
      ...chefCats.map(c => ({
        id: `nav-${c.id}`,
        label: c.name,
        sublabel: c.description,
        icon: c.icon,
        action: () => { onSelectCategory(c.id); onClose() },
      })),
    ]
  }, [onSelectCategory, onClose])

  /* ── Search results (single fuse pass) ── */
  const baseResults = useMemo<ArticleResult[]>(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      return recentArticles.length > 0
        ? recentArticles.map(r => ({ item: r.article, pct: r.pct }))
        : articles.slice(0, 10).map(a => ({ item: a }))
    }
    return fuse.search(trimmed, { limit: 12 }).map(r => ({
      item: r.item,
      matches: r.matches as ReadonlyArray<FuseResultMatch> | undefined,
    }))
  }, [articles, fuse, query, recentArticles])

  const articleResults = useMemo<ArticleResult[]>(
    () => filterCat ? baseResults.filter(r => r.item.category === filterCat) : baseResults,
    [baseResults, filterCat],
  )

  /* ── Chips (unfiltered categories present in results) ── */
  const chipCategories = useMemo(() => {
    const seen = new Set<string>()
    const out: typeof categories = []
    for (const r of baseResults) {
      if (!seen.has(r.item.category)) {
        seen.add(r.item.category)
        const cat = categoryById.get(r.item.category)
        if (cat) out.push(cat)
      }
      if (out.length >= 7) break
    }
    return out
  }, [baseResults])

  /* ── Derived flags ── */
  const showChips = chipCategories.length >= 1
  const showQuickActions = !query.trim() && !filterCat && quickActions.length > 0
  const totalItems = (showQuickActions ? quickActions.length : 0) + articleResults.length

  /* ── Reset active index on result count change ── */
  useEffect(() => {
    setActiveIndex(i => Math.min(i, totalItems === 0 ? 0 : totalItems - 1))
  }, [totalItems, articleResults.length]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Smooth-but-instant scroll into view ──
      Uses RAF to coalesce; only scrolls if element is outside visible area. ── */
  useEffect(() => {
    if (!open) return
    const container = listRef.current
    if (!container) return

    cancelAnimationFrame(scrollRafRef.current!)
    scrollRafRef.current = requestAnimationFrame(() => {
      // Use stable ID instead of querySelectorAll (which forces DOM walk)
      const el = document.getElementById(`cp-item-${activeIndex}`)
      if (!el) return

      const er = el.getBoundingClientRect()
      const cr = container.getBoundingClientRect()
      const padTop = 8
      const padBot = 8

      const aboveVisible = er.top < cr.top + padTop
      const belowVisible = er.bottom > cr.bottom - padBot

      if (aboveVisible || belowVisible) {
        ;(el as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'auto' })
      }
    })

    return () => { cancelAnimationFrame(scrollRafRef.current!) }
  }, [activeIndex, open])

  /* ── Active item derivation ── */
  const activeResult: ArticleResult | null = useMemo(() => {
    if (showQuickActions && activeIndex < quickActions.length) return null
    const idx = showQuickActions ? activeIndex - quickActions.length : activeIndex
    return articleResults[idx] ?? null
  }, [activeIndex, showQuickActions, quickActions.length, articleResults])

  const activeQuickAction: QuickAction | null = useMemo(() => {
    if (!showQuickActions || activeIndex >= quickActions.length) return null
    return quickActions[activeIndex] ?? null
  }, [showQuickActions, activeIndex, quickActions])

  /* ── Prefetch images for snappy previews ── */
  useEffect(() => {
    if (!wideEnough || !activeResult?.item.image) return
    const curId = activeResult.item.id
    const curSrc = activeResult.item.image!

    // Gather candidates: current, next, prev
    const idx = articleResults.findIndex(r => r.item.id === curId)
    const pool = [curSrc]
    if (idx >= 0) {
      const nxt = articleResults[idx + 1]?.item?.image
      const prv = articleResults[idx - 1]?.item?.image
      if (prv) pool.push(prv)
      if (nxt) pool.push(nxt)
    }

    // Spawn Image objects (triggers early TCP connection & decode start)
    pool.forEach(s => { const i = new Image(); i.src = s })
  }, [activeResult?.item.id, wideEnough, articleResults])

  /* ── Hover schedule (debounce) ── */
  const scheduleHover = useCallback((idx: number) => {
    // Clear pending
    if (hoverTimerRef.current != null) clearTimeout(hoverTimerRef.current)
    // Schedule
    hoverTimerRef.current = setTimeout(() => setActiveIndex(idx), 45)
  }, [])

  // Cleanup timers on unmount
  useEffect(() => () => {
    if (hoverTimerRef.current != null) clearTimeout(hoverTimerRef.current)
  }, [])

  /* ── Keyboard handling ── */
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      // Tab trap
      if (e.key === 'Tab') {
        const ctr = containerRef.current
        if (!ctr) return
        const focusable = Array.from(
          ctr.querySelectorAll<HTMLElement>(
            'input:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
          ),
        ).filter(el => el.closest('[aria-hidden]') === null)
        if (!focusable.length) return
        const f = focusable[0]
        const l = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus() }
        else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus() }
        return
      }

      // Escape (double-press: first clears query)
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        // @ts-ignore – stopImmediatePropagation
        e.nativeEvent.stopImmediatePropagation?.()
        if (query.trim()) { setQuery(''); setFilterCat(null); return }
        onClose()
        return
      }

      if (totalItems === 0) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => (i + 1) % totalItems) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => (i - 1 + totalItems) % totalItems) }
      else if (e.key === 'Enter') {
        e.preventDefault()
        if (showQuickActions && activeIndex < quickActions.length) {
          quickActions[activeIndex].action()
        } else {
          const idx = showQuickActions ? activeIndex - quickActions.length : activeIndex
          const res = articleResults[idx]
          if (res) { onClose(); onOpenArticle(res.item) }
        }
      }
    },
    [totalItems, showQuickActions, quickActions, articleResults, activeIndex, onClose, onOpenArticle, query],
  )

  /* ── Animation configs ── */
  const spring = shouldReduce
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 480, damping: 38, mass: 0.85 }

  const previewTransition = shouldReduce
    ? { duration: 0 }
    : { duration: 0.08, ease: 'easeOut' as const }

  /* ═════════════════════════════════════════
     RENDER
     ═════════════════════════════════════════ */
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{
            background: 'rgba(5,4,3,0.88)',
            backdropFilter: 'blur(22px) saturate(130%)',
            paddingTop: 'max(4svh, env(safe-area-inset-top, 16px))',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            alignItems: 'flex-start',
          }}
          initial={shouldReduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={shouldReduce ? { duration: 0 } : { duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Поиск по материалам"
            className="w-full overflow-hidden"
            style={{
              maxWidth: 980,
              borderRadius: '16px',
              maxHeight: 'min(92svh, 92vh)',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-command)',
              border: '1px solid var(--cp-chip-border)',
              boxShadow:
                '0 0 0 1px var(--cp-inset-1) inset, 0 1px 0 var(--cp-inset-2) inset, 0 50px 130px rgba(0,0,0,0.55), 0 20px 40px rgba(0,0,0,0.30)',
            }}
            initial={shouldReduce ? false : { y: -22, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={shouldReduce ? { opacity: 0 } : { y: -14, scale: 0.97, opacity: 0 }}
            transition={spring}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* ═══ Search bar ═══ */}
            <div className="flex items-center gap-3 px-5 shrink-0" style={{ height: 62 }}>
              <motion.svg
                className="h-[18px] w-[18px] shrink-0"
                animate={{
                  opacity: query ? 0.6 : 0.28,
                  color: query ? 'var(--text-accent)' : 'var(--text-primary)',
                }}
                transition={{ duration: 0.2 }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </motion.svg>

              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск материалов, шефов, техник..."
                aria-label="Поиск материалов, шефов и техник"
                className="flex-1 bg-transparent text-[17px] font-light tracking-wide outline-none"
                style={{ caretColor: 'var(--text-accent)', color: 'var(--text-primary)' }}
              />

              {/* Result count badge */}
              <AnimatePresence>
                {query && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                    className="font-mono text-[11px] uppercase tracking-[0.18em] shrink-0"
                    style={{ color: 'var(--text-accent)', opacity: 0.6 }}
                    aria-live="polite" aria-atomic="true"
                  >
                    {articleResults.length}&nbsp;{pluralRu(articleResults.length, RESULT)}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Clear button */}
              <AnimatePresence>
                {query && (
                  <motion.button
                    type="button"
                    aria-label="Очистить поиск"
                    initial={{ opacity: 0, scale: 0.6, rotate: -45 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.6, rotate: 45 }}
                    transition={{ type: 'spring', stiffness: 520, damping: 30 }}
                    onClick={() => { setQuery(''); setFilterCat(null); inputRef.current?.focus() }}
                    className="flex h-5 w-5 shrink-0 items-center justify-center"
                    style={{
                      background: 'var(--cp-clear-bg)',
                      color: 'var(--cp-clear-fg)',
                      fontSize: 14,
                      lineHeight: 1,
                      borderRadius: 2,
                    }}
                  >
                    ×
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Close trigger */}
              <button
                type="button"
                onClick={onClose}
                className="font-mono text-[11px] uppercase tracking-[0.18em] shrink-0 transition-opacity"
                style={{ color: 'var(--cp-text-mid)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.6' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
              >
                ESC
              </button>
            </div>

            <div style={{ height: 1, background: 'var(--cp-divider)', flexShrink: 0 }} />

            {/* ═══ Category chips ═══ */}
            <AnimatePresence>
              {showChips && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  style={{ overflow: 'hidden', flexShrink: 0 }}
                >
                  <div
                    className="cp-chips flex items-center gap-1.5 overflow-x-auto px-5 py-2"
                    style={{ borderBottom: '1px solid var(--cp-divider)' }}
                  >
                    <button
                      type="button"
                      onClick={() => setFilterCat(null)}
                      className="cp-chip shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] transition-all"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 2,
                        background: !filterCat ? 'var(--text-accent)' : 'var(--cp-chip)',
                        color: !filterCat ? 'var(--bg-main)' : 'var(--text-muted)',
                        border: '1px solid',
                        borderColor: !filterCat ? 'transparent' : 'var(--cp-chip-border)',
                      }}
                    >
                      Все
                    </button>

                    {chipCategories.map(cat => (
                      <motion.button
                        key={cat.id}
                        type="button"
                        layout
                        onClick={() => setFilterCat(prev => prev === cat.id ? null : cat.id)}
                        className="cp-chip shrink-0 font-mono text-[9px] uppercase tracking-[0.15em] transition-all"
                        style={{
                          padding: '4px 10px',
                          borderRadius: 2,
                          whiteSpace: 'nowrap',
                          background: filterCat === cat.id ? 'var(--text-accent)' : 'var(--cp-chip)',
                          color: filterCat === cat.id ? 'var(--bg-main)' : 'var(--text-muted)',
                          border: '1px solid',
                          borderColor: filterCat === cat.id ? 'transparent' : 'var(--cp-chip-border)',
                        }}
                      >
                        <span style={{ marginRight: 4, opacity: 0.65 }}>{cat.icon}</span>
                        {cat.name}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ═══ Body container (list + preview) ═══ */}
            <div style={{
              display: 'flex',
              alignItems: 'stretch',
              minHeight: 0,
              flex: 1,
              overflow: 'hidden',
            }}>
              {/* ─── Left column: results list ─── */}
              <div
                ref={listRef}
                className="cp-list min-w-0 flex-1 overflow-y-auto"
                style={{ maxHeight: 'min(72svh, 72vh)' }}
              >
                {/* Quick Actions section */}
                {showQuickActions && (
                  <>
                    <SectionLabel>Перейти</SectionLabel>
                    <div className="pb-1">
                      {quickActions.map((action, idx) => {
                        const isActive = idx === activeIndex
                        return (
                          <button
                            key={action.id}
                            type="button"
                            id={`cp-item-${idx}`}
                            data-item
                            onClick={action.action}
                            onMouseEnter={() => scheduleHover(idx)}
                            className="flex w-full items-center gap-3 px-5 py-2.5 text-left"
                            style={{
                              background: isActive ? 'var(--cp-surface)' : 'transparent',
                              borderLeft: isActive ? '2px solid var(--text-accent)' : '2px solid transparent',
                              transition: 'all 0.09s ease',
                            }}
                          >
                            <span
                              className="flex h-6 w-6 shrink-0 items-center justify-center font-mono text-[7px] font-bold uppercase"
                              style={{
                                borderRadius: 2,
                                background: isActive ? 'var(--text-accent)' : 'var(--cp-chip)',
                                color: isActive ? 'var(--bg-main)' : 'var(--text-muted)',
                                transition: 'all 0.09s ease',
                              }}
                            >
                              {action.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[14px] font-normal" style={{ color: 'var(--text-primary)' }}>
                                {action.label}
                              </p>
                              {action.sublabel && (
                                <p className="truncate font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                  {action.sublabel}
                                </p>
                              )}
                            </div>
                            <ArrowRight />
                          </button>
                        )
                      })}
                    </div>
                    <Divider />
                  </>
                )}

                {/* Results header */}
                {articleResults.length > 0 && (
                  <div className="flex items-center justify-between px-5 pb-1 pt-3">
                    <SectionLabel inline>
                      {query.trim()
                        ? `${articleResults.length} ${pluralRu(articleResults.length, RESULT)}`
                        : recentArticles.length > 0
                          ? 'Недавно читали'
                          : 'Материалы'}
                    </SectionLabel>
                    {filterCat && (
                      <button
                        type="button"
                        onClick={() => setFilterCat(null)}
                        className="font-mono text-[7.5px] uppercase tracking-[0.18em] transition-opacity"
                        style={{ color: 'var(--text-accent)', opacity: 0.65 }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.65' }}
                      >
                        × сбросить
                      </button>
                    )}
                  </div>
                )}

                {/* Article rows */}
                <div className="pb-2">
                  <AnimatePresence initial={false} mode="popLayout">
                    {articleResults.map((result, idx) => {
                      const art = result.item
                      const cat = categoryById.get(art.category)
                      const gIdx = showQuickActions ? quickActions.length + idx : idx
                      const isActive = gIdx === activeIndex
                      const byAuthor = !!result.matches?.find(m => m.key === 'author')?.indices?.length

                      return (
                        <motion.button
                          key={art.id}
                          type="button"
                          data-item
                          id={`cp-item-${gIdx}`}
                          layout
                          initial={shouldReduce ? false : { opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={
                            shouldReduce
                              ? {}
                              : { opacity: 0, scale: 0.97, transition: { duration: 0.1 } }
                          }
                          transition={shouldReduce ? { duration: 0 } : { duration: 0.15 }}
                          onClick={() => { onClose(); onOpenArticle(art) }}
                          onMouseEnter={() => scheduleHover(gIdx)}
                          className="flex w-full items-start gap-3 px-5 py-3.5 text-left"
                          style={{
                            background: isActive ? 'var(--cp-surface)' : 'transparent',
                            borderLeft: isActive ? '2px solid var(--text-accent)' : '2px solid transparent',
                            transition: 'background 0.1s ease, border-color 0.08s ease',
                          }}
                        >
                          {/* Thumbnail zone */}
                          <div style={{ position: 'relative', marginTop: 2, flexShrink: 0 }}>
                            {art.image ? (
                              <ArticleImage
                                src={art.image}
                                alt=""
                                style={{ width: 72, height: 72, borderRadius: 4 }}
                                fadeInDuration={180}
                                loading="lazy"
                              />
                            ) : (
                              <div style={{
                                width: 72, height: 72, borderRadius: 4,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: isActive ? 'var(--text-accent)' : 'var(--cp-chip)',
                                color: isActive ? 'var(--bg-main)' : 'var(--text-muted)',
                                fontFamily: 'monospace',
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                transition: 'all 0.1s ease',
                              }}>
                                {cat?.icon ?? '·'}
                              </div>
                            )}

                            {/* Progress bar */}
                            {(result.pct ?? 0) > 0 && (
                              <div style={{
                                position: 'absolute', bottom: 0, left: 0,
                                height: 2, width: `${result.pct}%`,
                                background: 'var(--text-accent)',
                                borderRadius: '0 0 0 2px',
                              }} />
                            )}

                            {/* Active ring */}
                            {isActive && art.image && (
                              <motion.div
                                layoutId="cp-active-ring"
                                style={{
                                  position: 'absolute', inset: -1,
                                  border: '1.5px solid var(--text-accent)',
                                  borderRadius: 5,
                                  opacity: 0.5,
                                  pointerEvents: 'none',
                                }}
                                transition={{ type: 'spring', stiffness: 600, damping: 42 }}
                              />
                            )}
                          </div>

                          {/* Text content */}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p
                              className="truncate text-[15px] font-normal leading-snug"
                              style={{
                                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                                transition: 'color 0.1s ease',
                              }}
                            >
                              <H text={art.title} matches={result.matches} field="title" />
                            </p>

                            <p className="mt-0.5 truncate font-mono text-[10px]" style={{ color: 'var(--cp-text-mid)' }}>
                              <span style={{ opacity: 0.7 }}>{cat?.icon ?? '·'}</span>{' '}
                              {cat?.name ?? art.category}{' · '}{art.readTime} мин
                              {art.author && (
                                <>
                                  {' · '}
                                  <span style={byAuthor ? { color: 'var(--text-accent)', opacity: 0.8 } : undefined}>
                                    <H text={art.author} matches={result.matches} field="author" />
                                  </span>
                                </>
                              )}
                            </p>

                            {/* Expandable tags on active row */}
                            <AnimatePresence>
                              {isActive && (art.tags ?? []).length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                  animate={{ opacity: 1, height: 'auto', marginTop: 6 }}
                                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                                  className="flex flex-wrap gap-1 overflow-hidden"
                                >
                                  {(art.tags ?? []).slice(0, 4).map(tag => (
                                    <span
                                      key={tag}
                                      className="font-mono text-[7.5px] uppercase tracking-[0.12em]"
                                      style={{
                                        padding: '2px 6px',
                                        border: '1px solid var(--cp-chip-border)',
                                        color: 'var(--cp-text-mid)',
                                        borderRadius: 2,
                                      }}
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.button>
                      )
                    })}
                  </AnimatePresence>

                  {/* Empty states */}
                  {articleResults.length === 0 && (query.trim() || filterCat) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="px-5 py-12 text-center"
                    >
                      <div
                        className="mx-auto mb-4 flex h-10 w-10 items-center justify-center font-mono text-base"
                        style={{ background: 'var(--cp-chip)', borderRadius: 4, color: 'var(--cp-text-mid)' }}
                      >
                        ∅
                      </div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                        Ничего не найдено
                      </p>
                      {query.trim() && (
                        <p className="mt-1.5 text-[11px]" style={{ color: 'var(--cp-text-mid)' }}>
                          «{query}»
                        </p>
                      )}
                      {filterCat && (
                        <button
                          type="button"
                          onClick={() => setFilterCat(null)}
                          className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] transition-opacity"
                          style={{ color: 'var(--text-accent)' }}
                        >
                          × сбросить фильтр
                        </button>
                      )}
                      <p className="mt-3 font-mono text-[8.5px]" style={{ color: 'var(--cp-text-lo)' }}>
                        Попробуйте: шоколад · ваниль · крем · техники
                      </p>
                    </motion.div>
                  )}

                  {articleResults.length === 0 && !query.trim() && !filterCat && (
                    <div className="px-5 py-10 text-center">
                      <p className="font-mono text-[9px] uppercase tracking-[0.28em]" style={{ color: 'var(--cp-text-mid)' }}>
                        Начните вводить для поиска
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ─── Right column: preview (md+) ───
                  Fixed-width static parent (320px) guarantees geometry stability.
                  Children are absolutely-positioned and managed by AnimatePresence(mode='wait')
                  so only ONE preview renders at a time, eliminating double-content artifacts.
               ─── */}
              {wideEnough && (activeQuickAction || activeResult) && (
                <div
                  style={{
                    position: 'relative',
                    width: 320,
                    flexShrink: 0,
                    borderLeft: '1px solid var(--cp-divider)',
                    overflow: 'hidden',
                    alignSelf: 'stretch',
                    minHeight: 0,
                  }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {/* Quick Action preview */}
                    {activeQuickAction ? (
                      <motion.div
                        key={`qa-${activeQuickAction.id}`}
                        initial={shouldReduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={shouldReduce ? {} : { opacity: 0 }}
                        transition={previewTransition}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '28px 22px',
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{
                            width: 56, height: 56,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--cp-chip)',
                            border: '1px solid var(--cp-chip-border)',
                            borderRadius: 4,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 14,
                            color: 'var(--text-accent)',
                            letterSpacing: '0.08em',
                          }}>
                            {activeQuickAction.icon}
                          </div>

                          <p className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--cp-text-mid)' }}>
                            Раздел архива
                          </p>

                          <p
                            className="font-serif text-[19px] font-semibold leading-tight tracking-[-0.03em]"
                            style={{ color: 'var(--text-primary)', minHeight: '2.4em', display: 'flex', alignItems: 'flex-start' }}
                          >
                            {activeQuickAction.label}
                          </p>

                          {activeQuickAction.sublabel && (
                            <p className="text-[12px] leading-5" style={{ color: 'var(--text-muted)' }}>
                              {activeQuickAction.sublabel}
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={activeQuickAction.action}
                            className="mt-3 flex items-center gap-2 font-mono text-[8.5px] uppercase tracking-[0.22em] transition-all"
                            style={{
                              color: 'var(--text-accent)',
                              opacity: 0.85,
                              alignSelf: 'flex-start',
                              padding: '4px 0',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                          >
                            Открыть
                            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                          </button>
                        </div>
                      </motion.div>
                    ) : activeResult ? (
                      /* Article preview */
                      <motion.div
                        key={`ar-${activeResult.item.id}`}
                        initial={shouldReduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={shouldReduce ? {} : { opacity: 0 }}
                        transition={previewTransition}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Hero image area */}
                        <div style={{ position: 'relative', height: 260, flexShrink: 0 }}>
                          {activeResult.item.image ? (
                            <ArticleImage
                              src={activeResult.item.image}
                              alt={activeResult.item.title}
                              style={{ width: '100%', height: '100%' }}
                              fadeInDuration={350}
                              loading="eager"
                            />
                          ) : (
                            <div style={{
                              width: '100%', height: '100%',
                              background: 'var(--cp-chip)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 28, opacity: 0.15, color: 'var(--text-primary)',
                            }}>
                              {categoryById.get(activeResult.item.category)?.icon ?? '✦'}
                            </div>
                          )}

                          {/* Gradient overlay */}
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.04) 30%, var(--bg-command) 100%)',
                            pointerEvents: 'none',
                          }} />

                          {/* Category badge */}
                          <div style={{
                            position: 'absolute', top: 10, left: 10,
                            padding: '3px 8px',
                            background: 'var(--cp-badge-scrim)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid var(--cp-chip-border)',
                            borderRadius: 2,
                          }}>
                            <span className="font-mono text-[7px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                              {categoryById.get(activeResult.item.category)?.icon}{' '}
                              {categoryById.get(activeResult.item.category)?.name ?? activeResult.item.category}
                            </span>
                          </div>

                          {/* Progress bar */}
                          {(activeResult.pct ?? 0) > 0 && (
                            <div style={{
                              position: 'absolute', bottom: 0, left: 0, right: 0,
                              height: 2, background: 'var(--cp-chip)',
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${activeResult.pct}%`,
                                background: 'var(--text-accent)',
                              }} />
                            </div>
                          )}
                        </div>

                        {/* Meta content */}
                        <div style={{
                          padding: '16px 18px 14px',
                          flex: 1,
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}>
                          <p className="text-[15px] font-normal" style={{
                            color: 'var(--text-primary)',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            <H text={activeResult.item.title} matches={activeResult.matches} field="title" />
                          </p>

                          {activeResult.item.excerpt && (
                            <p className="text-[12px] leading-relaxed" style={{
                              color: 'var(--text-muted)',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              <H text={activeResult.item.excerpt} matches={activeResult.matches} field="excerpt" />
                            </p>
                          )}

                          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: 'var(--cp-text-mid)' }}>
                            <span>{activeResult.item.readTime} мин</span>
                            {activeResult.item.date && (
                              <>
                                <span style={{ opacity: 0.4 }}>·</span>
                                <span>
                                  {new Date(activeResult.item.date + 'T12:00:00').toLocaleDateString('ru-RU', {
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                              </>
                            )}
                          </div>

                          {activeResult.item.author && (
                            <p className="font-mono text-[9px] tracking-[0.1em]" style={{ color: 'var(--cp-text-mid)' }}>
                              {activeResult.item.author}
                            </p>
                          )}

                          {(activeResult.item.tags ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {(activeResult.item.tags ?? []).slice(0, 3).map(tag => (
                                <span key={tag}
                                  className="font-mono text-[7px] uppercase tracking-[0.1em]"
                                  style={{
                                    padding: '2px 6px',
                                    border: '1px solid var(--cp-chip-border)',
                                    color: 'var(--cp-text-mid)',
                                    borderRadius: 2,
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => { onClose(); onOpenArticle(activeResult.item) }}
                            className="mt-auto flex items-center gap-2 font-mono text-[8.5px] uppercase tracking-[0.22em] transition-all"
                            style={{
                              color: 'var(--text-accent)',
                              opacity: 0.65,
                              alignSelf: 'flex-start',
                              padding: '4px 0',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.65' }}
                          >
                            Читать
                            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                          </button>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* ═══ Footer ═══ */}
            <div
              className="flex items-center justify-between px-5 py-2.5 shrink-0"
              style={{ borderTop: '1px solid var(--cp-divider)' }}
            >
              <div className="flex items-center gap-5 font-mono text-[9px] uppercase tracking-[0.24em]" style={{ color: 'var(--cp-text-mid)' }}>
                <span>↑↓ навигация</span>
                <span>↵ открыть</span>
                <span className="hidden sm:inline">esc закрыть</span>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: 'var(--cp-text-lo)' }}>
                {articles.length}&thinsp;{pluralRu(articles.length, MATERIAL)}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
