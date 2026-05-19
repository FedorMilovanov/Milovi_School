// CommandPalette v5.0 — grouped sections + robust image fallback
// What changed vs v4.0:
//  [SEC] Results are grouped under fixed top-level sections, NOT chef names:
//        Шефы и Мастера · Техники · Рецепты · Цифры Гурмана · Histoire Culinaire · Французская кухня
//        Section chips are always the same six (Algolia/Linear/Raycast pattern),
//        with per-section result counts.
//  [LIM] Fuse limit raised 12 → 60, idle slice 10 → 24 — Algolia recommends 20–50
//        hits per group; we cap per-section visible to 6 with «показать ещё N».
//  [GRP] Groups render with sticky-section headers; flat keyboard index walks
//        only currently visible items so ↑/↓ behaves naturally across groups.
//  [IMG] Failed images now fall back to a local pastry photo (fallbackImageFor)
//        instead of an empty «✦» glyph. Reset on every src change via token.
//
// Architecture decisions kept from v4.0:
//  [IMG] useEffect + img.decode() with tokens → no blocking, cached images show instantly.
//  [PRV] mode="wait" inside static container (320px) → single DOM node at a time.
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
import { fallbackImageFor } from '../assets/images'

/* ═════════════════════════════════════════
   Static data – computed once
   ═════════════════════════════════════════ */
const categoryById = new Map(categories.map(c => [c.id, c]))

/* ───── Top-level sections (single source of truth for grouping + chips) ─────
   The user sees results split by these six fixed sections, NEVER by individual
   chef names. Chef-specific categories collapse into the «Шефы и Мастера»
   group; the rest are first-class buckets.                                    */
interface SectionDef {
  id: string
  label: string
  icon: string
  matches: (a: ArticleClientMeta) => boolean
}

const SECTIONS: SectionDef[] = [
  {
    id: 'chefs',
    label: 'Шефы и Мастера',
    icon: '✦',
    matches: (a) => !NON_CHEF_CATEGORY_IDS.has(a.category),
  },
  {
    id: 'techniques',
    label: 'Техники',
    icon: 'TK',
    matches: (a) => a.category === 'techniques',
  },
  {
    id: 'recipes',
    label: 'Рецепты',
    icon: 'RC',
    matches: (a) => a.category === 'recipes',
  },
  {
    id: 'chiffres-gourmands',
    label: 'Цифры Гурмана',
    icon: 'EC',
    matches: (a) => a.category === 'chiffres-gourmands',
  },
  {
    id: 'histoire-culinaire',
    label: 'Histoire Culinaire',
    icon: 'HC',
    matches: (a) => a.category === 'histoire-culinaire',
  },
  {
    id: 'french-cuisine',
    label: 'Французская кухня',
    icon: 'FR',
    matches: (a) => a.category === 'french-cuisine',
  },
]

const SECTION_BY_ID = new Map(SECTIONS.map(s => [s.id, s]))

/** Cover images shown in the right panel when the user hovers a section nav item.
    Источники: /public/images/ (4 дедикатные) + лучшие статьи для остальных разделов. */
const SECTION_COVER: Record<string, string> = {
  chefs:                '/images/cat-chefs.webp',
  techniques:           '/images/cat-techniques.webp',
  recipes:              '/images/cat-recipes.webp',
  'chiffres-gourmands': '/images/cat-chiffres.webp',
  'histoire-culinaire': '/images/articles/stohrer-1730.webp',
  'french-cuisine':     '/images/articles/cuisine-brigade.webp',
}

/** Returns the section id a given article belongs to (first match wins). */
function sectionIdFor(a: ArticleClientMeta): string {
  for (const s of SECTIONS) if (s.matches(a)) return s.id
  return 'chefs' // safe default — chef catch-all
}

/** Initial visible items per section (before user expands). */
const PER_SECTION_INITIAL = 6

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
  sectionId: string
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
   ArticleImage – robust image loading + local fallback
   ═════════════════════════════════════════
   On network/404 error we automatically swap to a bundled local fallback
   chosen by category (fallbackImageFor). Only after the FALLBACK also fails
   do we show the «✦» glyph — so the search preview never breaks the layout.
   Token + srcRef guard against stale callbacks when src changes rapidly.
   ═════════════════════════════════════════ */
function ArticleImage({
  src,
  alt,
  style,
  fadeInDuration = 350,
  loading = 'lazy',
  fallbackSrc,
}: {
  src: string
  alt: string
  style?: CSSProperties
  fadeInDuration?: number
  loading?: 'lazy' | 'eager'
  /** Local guaranteed image to use if `src` fails (404, CORS, decode error). */
  fallbackSrc?: string
}) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const fallbackTriedRef = useRef(false)

  const imgRef = useRef<HTMLImageElement>(null)
  const srcRef = useRef(currentSrc)
  const tokenRef = useRef(0)

  useEffect(() => { srcRef.current = currentSrc }, [currentSrc])

  // Reset when the upstream src prop changes (new article hovered)
  useEffect(() => {
    fallbackTriedRef.current = false
    setCurrentSrc(src)
  }, [src])

  const triggerFallback = useCallback(() => {
    if (!fallbackTriedRef.current && fallbackSrc && fallbackSrc !== currentSrc) {
      fallbackTriedRef.current = true
      setErrored(false)
      setLoaded(false)
      setCurrentSrc(fallbackSrc)
      return
    }
    setErrored(true)
    setLoaded(false)
  }, [currentSrc, fallbackSrc])

  // Main effect: reset state + handle cache
  useEffect(() => {
    const tok = ++tokenRef.current
    const cs = currentSrc

    setLoaded(false)
    setErrored(false)

    const img = imgRef.current
    if (!img) return

    if (img.complete) {
      img
        .decode()
        .then(() => {
          if (tok !== tokenRef.current) return
          if (srcRef.current !== cs) return
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            setLoaded(true)
          } else {
            triggerFallback()
          }
        })
        .catch(() => {
          if (tok !== tokenRef.current) return
          if (srcRef.current !== cs) return
          triggerFallback()
        })
    }
  }, [currentSrc, triggerFallback])

  const handleLoad = useCallback(() => {
    if (srcRef.current !== currentSrc) return
    setLoaded(true)
    setErrored(false)
  }, [currentSrc])

  const handleError = useCallback(() => {
    if (srcRef.current !== currentSrc) return
    triggerFallback()
  }, [currentSrc, triggerFallback])

  return (
    <div style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {!loaded && !errored && (
        <div className="cp-skeleton" style={{ position: 'absolute', inset: 0 }} aria-hidden="true" />
      )}
      {!errored && (
        <img
          ref={imgRef}
          src={currentSrc}
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
  /** Now holds a SECTION id (e.g. 'chefs', 'techniques'), not a category id. */
  const [filterSection, setFilterSection] = useState<string | null>(null)
  /** Per-section expand state — sections start collapsed at PER_SECTION_INITIAL. */
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set())
  const [wideEnough, setWideEnough] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 768,
  )

  /* ── Refs ── */
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldReduce = useReducedMotion()

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollRafRef = useRef<number | null>(null)
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

    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)

    setQuery(initialQuery)
    setActiveIndex(0)
    setFilterSection(null)
    setExpandedSections(new Set())

    prevFocusRef.current = document.activeElement as HTMLElement | null
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [open, initialQuery])

  // Restore focus on close
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
        .slice(0, 8),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [articles, open],
  )

  /* ── Quick actions: only top-level sections (no individual chef names) ── */
  const quickActions: QuickAction[] = useMemo(() => {
    if (!onSelectCategory) return []
    return SECTIONS.map(s => ({
      id: `nav-${s.id}`,
      sectionId: s.id,
      label: s.label,
      sublabel:
        s.id === 'chefs'
          ? 'Биографии и почерк 14 шефов и мастеров'
          : categoryById.get(s.id)?.description ?? '',
      icon: s.icon,
      action: () => {
        onSelectCategory(s.id === 'chefs' ? 'chefs' : s.id)
        onClose()
      },
    }))
  }, [onSelectCategory, onClose])

  /* ── Search results (single fuse pass) ──
       Limits expanded so groups have enough items per section. ── */
  const baseResults = useMemo<ArticleResult[]>(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      // No query: show recent first; otherwise interleave by section so user
      // sees representation from every group on first paint.
      if (recentArticles.length > 0) {
        return recentArticles.map(r => ({ item: r.article, pct: r.pct }))
      }
      const seenSection = new Set<string>()
      const head: ArticleResult[] = []
      const tail: ArticleResult[] = []
      for (const a of articles) {
        const sid = sectionIdFor(a)
        if (!seenSection.has(sid)) { seenSection.add(sid); head.push({ item: a }) }
        else tail.push({ item: a })
      }
      return [...head, ...tail].slice(0, 30)
    }
    return fuse.search(trimmed, { limit: 60 }).map(r => ({
      item: r.item,
      matches: r.matches as ReadonlyArray<FuseResultMatch> | undefined,
    }))
  }, [articles, fuse, query, recentArticles])

  /* ── Section counts — ВСЕГДА по полному набору, не по baseResults ──
       Причина бага: baseResults лимитирован (8 недавних или 30 интерливных),
       поэтому разделы с нулём в выборке отображались как disabled.
       Теперь: без запроса — считаем все articles, с запросом — все Fuse-результаты. */
  const sectionCounts = useMemo(() => {
    const counts = new Map<string, number>()
    const trimmed = query.trim()
    if (trimmed) {
      // Full Fuse scan (no limit) for accurate per-section counts
      for (const r of fuse.search(trimmed)) {
        const sid = sectionIdFor(r.item)
        counts.set(sid, (counts.get(sid) ?? 0) + 1)
      }
    } else {
      // All articles — no sampling
      for (const a of articles) {
        const sid = sectionIdFor(a)
        counts.set(sid, (counts.get(sid) ?? 0) + 1)
      }
    }
    return counts
  }, [articles, fuse, query])

  /** Total matching count for the «Все» chip. */
  const totalMatchCount = useMemo(
    () => [...sectionCounts.values()].reduce((acc, n) => acc + n, 0),
    [sectionCounts],
  )

  /* ── Apply filter chip (by SECTION) ──
       When a chip is active, show ALL articles in that section (full set or
       full fuse results). Never limit to baseResults — the sample is too small. */
  const filteredResults = useMemo<ArticleResult[]>(() => {
    if (!filterSection) return baseResults

    const trimmed = query.trim()
    if (trimmed) {
      // All Fuse results (no limit) filtered to the selected section
      return fuse.search(trimmed).reduce<ArticleResult[]>((acc, r) => {
        if (sectionIdFor(r.item) === filterSection) {
          acc.push({ item: r.item, matches: r.matches as ReadonlyArray<FuseResultMatch> | undefined })
        }
        return acc
      }, [])
    }
    // No query — all articles in this section
    return articles
      .filter(a => sectionIdFor(a) === filterSection)
      .map(a => ({ item: a }))
  }, [baseResults, filterSection, articles, fuse, query])

  /* ── Build the actually visible list (grouped or flat) ──
       - When filterSection set: one block, fully expanded.
       - When no filter: for each section that has hits, include up to
         PER_SECTION_INITIAL items unless user expanded that section. */
  type GroupBlock = { sectionId: string; results: ArticleResult[]; total: number; collapsed: boolean }

  const groupedBlocks = useMemo<GroupBlock[]>(() => {
    if (filterSection) {
      const section = SECTION_BY_ID.get(filterSection)
      if (!section) return []
      return [{
        sectionId: filterSection,
        results: filteredResults,
        total: filteredResults.length,
        collapsed: false,
      }]
    }
    const buckets = new Map<string, ArticleResult[]>()
    for (const r of baseResults) {
      const sid = sectionIdFor(r.item)
      const arr = buckets.get(sid) ?? []
      arr.push(r)
      buckets.set(sid, arr)
    }
    const blocks: GroupBlock[] = []
    for (const s of SECTIONS) {
      const arr = buckets.get(s.id)
      if (!arr || arr.length === 0) continue
      const expanded = expandedSections.has(s.id)
      const slice = expanded ? arr : arr.slice(0, PER_SECTION_INITIAL)
      blocks.push({
        sectionId: s.id,
        results: slice,
        total: arr.length,
        collapsed: !expanded && arr.length > PER_SECTION_INITIAL,
      })
    }
    return blocks
  }, [baseResults, filteredResults, filterSection, expandedSections])

  /** Flat list of currently visible items — used for ↑/↓ and ↵. */
  const flatVisible = useMemo<ArticleResult[]>(
    () => groupedBlocks.flatMap(b => b.results),
    [groupedBlocks],
  )

  /* ── Derived flags ── */
  const showChips = totalMatchCount > 0
  const showQuickActions = !query.trim() && !filterSection && quickActions.length > 0
  const totalItems = (showQuickActions ? quickActions.length : 0) + flatVisible.length

  /* ── Reset active index on result count change ── */
  useEffect(() => {
    setActiveIndex(i => Math.min(i, totalItems === 0 ? 0 : totalItems - 1))
  }, [totalItems])

  /* ── Smooth scroll into view ── */
  useEffect(() => {
    if (!open) return
    const container = listRef.current
    if (!container) return

    cancelAnimationFrame(scrollRafRef.current!)
    scrollRafRef.current = requestAnimationFrame(() => {
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
    return flatVisible[idx] ?? null
  }, [activeIndex, showQuickActions, quickActions.length, flatVisible])

  const activeQuickAction: QuickAction | null = useMemo(() => {
    if (!showQuickActions || activeIndex >= quickActions.length) return null
    return quickActions[activeIndex] ?? null
  }, [showQuickActions, activeIndex, quickActions])

  /* ── Prefetch images for snappy previews ── */
  useEffect(() => {
    if (!wideEnough || !activeResult?.item.image) return
    const curId = activeResult.item.id
    const curSrc = activeResult.item.image!

    const idx = flatVisible.findIndex(r => r.item.id === curId)
    const pool = [curSrc]
    if (idx >= 0) {
      const nxt = flatVisible[idx + 1]?.item?.image
      const prv = flatVisible[idx - 1]?.item?.image
      if (prv) pool.push(prv)
      if (nxt) pool.push(nxt)
    }
    pool.forEach(s => { const i = new Image(); i.src = s })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeResult?.item.id, wideEnough, flatVisible])

  /* ── Hover debounce ── */
  const scheduleHover = useCallback((idx: number) => {
    if (hoverTimerRef.current != null) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => setActiveIndex(idx), 45)
  }, [])

  useEffect(() => () => {
    if (hoverTimerRef.current != null) clearTimeout(hoverTimerRef.current)
  }, [])

  /* ── Toggle a section's expand state ── */
  const toggleExpand = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }, [])

  /* ── Keyboard handling ── */
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
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

      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        e.nativeEvent.stopImmediatePropagation?.()
        if (query.trim()) { setQuery(''); setFilterSection(null); return }
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
          const res = flatVisible[idx]
          if (res) { onClose(); onOpenArticle(res.item) }
        }
      }
    },
    [totalItems, showQuickActions, quickActions, flatVisible, activeIndex, onClose, onOpenArticle, query],
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
                    {filteredResults.length}&nbsp;{pluralRu(filteredResults.length, RESULT)}
                  </motion.span>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {query && (
                  <motion.button
                    type="button"
                    aria-label="Очистить поиск"
                    initial={{ opacity: 0, scale: 0.6, rotate: -45 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.6, rotate: 45 }}
                    transition={{ type: 'spring', stiffness: 520, damping: 30 }}
                    onClick={() => { setQuery(''); setFilterSection(null); inputRef.current?.focus() }}
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

            {/* ═══ Section chips (FIXED top-level sections) ═══ */}
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
                      onClick={() => setFilterSection(null)}
                      className="cp-chip shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] transition-all"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 2,
                        background: !filterSection ? 'var(--text-accent)' : 'var(--cp-chip)',
                        color: !filterSection ? 'var(--bg-main)' : 'var(--text-muted)',
                        border: '1px solid',
                        borderColor: !filterSection ? 'transparent' : 'var(--cp-chip-border)',
                      }}
                    >
                      Все ·&nbsp;{totalMatchCount}
                    </button>

                    {SECTIONS.map(section => {
                      const count = sectionCounts.get(section.id) ?? 0
                      const isActive = filterSection === section.id
                      const isDimmed = count === 0
                      return (
                        <motion.button
                          key={section.id}
                          type="button"
                          layout
                          disabled={isDimmed}
                          onClick={() =>
                            setFilterSection(prev => (prev === section.id ? null : section.id))
                          }
                          className="cp-chip shrink-0 font-mono text-[9px] uppercase tracking-[0.15em] transition-all"
                          style={{
                            padding: '4px 10px',
                            borderRadius: 2,
                            whiteSpace: 'nowrap',
                            background: isActive ? 'var(--text-accent)' : 'var(--cp-chip)',
                            color: isActive ? 'var(--bg-main)' : 'var(--text-muted)',
                            border: '1px solid',
                            borderColor: isActive ? 'transparent' : 'var(--cp-chip-border)',
                            opacity: isDimmed ? 0.35 : 1,
                            cursor: isDimmed ? 'default' : 'pointer',
                          }}
                          title={isDimmed ? `${section.label} — нет результатов` : section.label}
                        >
                          <span style={{ marginRight: 4, opacity: 0.65 }}>{section.icon}</span>
                          {section.label}
                          <span style={{ marginLeft: 6, opacity: 0.55 }}>{count}</span>
                        </motion.button>
                      )
                    })}
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
                    <SectionLabel>Перейти в раздел</SectionLabel>
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

                {/* ─── Grouped article results ─── */}
                {groupedBlocks.length > 0 && (
                  <div className="pb-2">
                    {(() => {
                      let runningIdx = showQuickActions ? quickActions.length : 0
                      return groupedBlocks.map((block, blockI) => {
                        const section = SECTION_BY_ID.get(block.sectionId)
                        if (!section) return null

                        const blockStart = runningIdx
                        runningIdx += block.results.length

                        return (
                          <div key={`block-${block.sectionId}`}>
                            {/* Section header */}
                            <div className="flex items-center justify-between px-5 pb-1 pt-3">
                              <SectionLabel inline>
                                <span style={{ opacity: 0.7, marginRight: 6 }}>{section.icon}</span>
                                {section.label}
                                <span style={{ marginLeft: 8, opacity: 0.55 }}>· {block.total}</span>
                              </SectionLabel>
                              {!filterSection && block.total > PER_SECTION_INITIAL && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(block.sectionId)}
                                  className="font-mono text-[8.5px] uppercase tracking-[0.18em] transition-opacity"
                                  style={{ color: 'var(--text-accent)', opacity: 0.75 }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.75' }}
                                >
                                  {expandedSections.has(block.sectionId)
                                    ? '↑ свернуть'
                                    : `↓ ещё ${block.total - PER_SECTION_INITIAL}`}
                                </button>
                              )}
                              {filterSection && block.sectionId === filterSection && (
                                <button
                                  type="button"
                                  onClick={() => setFilterSection(null)}
                                  className="font-mono text-[7.5px] uppercase tracking-[0.18em] transition-opacity"
                                  style={{ color: 'var(--text-accent)', opacity: 0.65 }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.65' }}
                                >
                                  × сбросить
                                </button>
                              )}
                            </div>

                            <AnimatePresence initial={false} mode="popLayout">
                              {block.results.map((result, idxInBlock) => {
                                const art = result.item
                                const cat = categoryById.get(art.category)
                                const gIdx = blockStart + idxInBlock
                                const isActive = gIdx === activeIndex
                                const byAuthor = !!result.matches?.find(m => m.key === 'author')?.indices?.length
                                const fallback = fallbackImageFor(art.category)

                                return (
                                  <motion.button
                                    key={art.id}
                                    type="button"
                                    data-item
                                    id={`cp-item-${gIdx}`}
                                    layout
                                    initial={shouldReduce ? false : { opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={shouldReduce ? {} : { opacity: 0, scale: 0.97, transition: { duration: 0.1 } }}
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
                                    <div style={{ position: 'relative', marginTop: 2, flexShrink: 0 }}>
                                      <ArticleImage
                                        src={art.image || fallback}
                                        fallbackSrc={fallback}
                                        alt=""
                                        style={{ width: 72, height: 72, borderRadius: 4 }}
                                        fadeInDuration={180}
                                        loading="lazy"
                                      />

                                      {(result.pct ?? 0) > 0 && (
                                        <div style={{
                                          position: 'absolute', bottom: 0, left: 0,
                                          height: 2, width: `${result.pct}%`,
                                          background: 'var(--text-accent)',
                                          borderRadius: '0 0 0 2px',
                                        }} />
                                      )}

                                      {isActive && (
                                        <motion.div
                                          layoutId="cp-active-ring"
                                          style={{
                                            position: 'absolute', inset: -1,
                                            border: '1.5px solid var(--text-accent)',
                                            borderRadius: 5,
                                            opacity: 0.5,
                                            pointerEvents: 'none',
                                          }}
                                          transition={{ type: 'spring', stiffness: 600, damping: 38 }}
                                        />
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p
                                        className="text-[14px] font-normal leading-[1.35]"
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

                            {blockI < groupedBlocks.length - 1 && <Divider />}
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}

                {/* Empty states */}
                {flatVisible.length === 0 && (query.trim() || filterSection) && (
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
                    {filterSection && (
                      <button
                        type="button"
                        onClick={() => setFilterSection(null)}
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

                {flatVisible.length === 0 && !query.trim() && !filterSection && (
                  <div className="px-5 py-10 text-center">
                    <p className="font-mono text-[9px] uppercase tracking-[0.28em]" style={{ color: 'var(--cp-text-mid)' }}>
                      Начните вводить для поиска
                    </p>
                  </div>
                )}
              </div>

              {/* ─── Right column: preview (md+) ─── */}
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
                          overflow: 'hidden',
                        }}
                      >
                        {/* Section cover image */}
                        {SECTION_COVER[activeQuickAction.sectionId] && (
                          <div style={{ position: 'relative', height: 200, flexShrink: 0 }}>
                            <ArticleImage
                              src={SECTION_COVER[activeQuickAction.sectionId]!}
                              alt={activeQuickAction.label}
                              style={{ width: '100%', height: '100%' }}
                              fadeInDuration={350}
                              loading="eager"
                            />
                            <div style={{
                              position: 'absolute', inset: 0,
                              background: 'linear-gradient(to bottom, rgba(0,0,0,0.04) 30%, var(--bg-command) 100%)',
                              pointerEvents: 'none',
                            }} />
                          </div>
                        )}

                        <div style={{
                          padding: '18px 22px 22px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          flex: 1,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 40, height: 40,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'var(--cp-chip)',
                              border: '1px solid var(--cp-chip-border)',
                              borderRadius: 4,
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              color: 'var(--text-accent)',
                              letterSpacing: '0.08em',
                              flexShrink: 0,
                            }}>
                              {activeQuickAction.icon}
                            </div>

                            <p className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--cp-text-mid)' }}>
                              Раздел архива
                            </p>
                          </div>

                          <p
                            className="font-serif text-[19px] font-semibold leading-tight tracking-[-0.03em]"
                            style={{ color: 'var(--text-primary)' }}
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
                            className="mt-auto flex items-center gap-2 font-mono text-[8.5px] uppercase tracking-[0.22em] transition-all"
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
                          <ArticleImage
                            src={activeResult.item.image || fallbackImageFor(activeResult.item.category)}
                            fallbackSrc={fallbackImageFor(activeResult.item.category)}
                            alt={activeResult.item.title}
                            style={{ width: '100%', height: '100%' }}
                            fadeInDuration={350}
                            loading="eager"
                          />

                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.04) 30%, var(--bg-command) 100%)',
                            pointerEvents: 'none',
                          }} />

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
