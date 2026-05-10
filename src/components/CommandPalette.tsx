import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Fuse, { type IFuseOptions } from 'fuse.js'
import type { ArticleMeta } from '../data/articles'
import { categories } from '../data/categories'
import { pluralRu, MATERIAL, RESULT } from '../utils/plural'
import { safeGetItem } from '../utils/storage'

interface CommandPaletteProps {
  open: boolean
  articles: ArticleMeta[]
  onClose: () => void
  onOpenArticle: (article: ArticleMeta) => void
  /** GAP-05: navigate to a category section from the palette */
  onSelectCategory?: (id: string) => void
}

const FUSE_OPTIONS: IFuseOptions<ArticleMeta> = {
  keys: [
    { name: 'title', weight: 0.45 },
    { name: 'excerpt', weight: 0.2 },
    { name: 'author', weight: 0.15 },
    { name: 'tags', weight: 0.15 },
    { name: 'category', weight: 0.05 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
}

function Highlight({ text, pattern }: { text: string; pattern: string }) {
  if (!pattern || pattern.length < 2) return <>{text}</>
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const exact = new RegExp(`^${escaped}$`, 'i')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        exact.test(part) ? (
          <mark key={i} className="bg-transparent font-semibold" style={{ color: 'var(--text-accent)' }}>{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

// GAP-05: Quick navigation actions shown at empty query
interface QuickAction {
  id: string
  label: string
  sublabel?: string
  icon: string
  action: () => void
}

export default function CommandPalette({ open, articles, onClose, onOpenArticle, onSelectCategory }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldReduce = useReducedMotion()

  // BUG-FIX: create the Fuse instance inside a useMemo so it is rebuilt only
  // when `articles` changes. This keeps the memo pure (no side-effects) and
  // ensures search results are always consistent with the current article list.
  // The original code mutated a module-level singleton inside useMemo (wrong).
  const fuse = useMemo(() => new Fuse<ArticleMeta>(articles, FUSE_OPTIONS), [articles])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Scroll lock — prevent body scroll while palette is open
  useEffect(() => {
    if (!open) return
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth
    const prevOverflow = document.body.style.overflow
    const prevPad = document.body.style.paddingRight
    document.body.style.overflow = 'hidden'
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPad
    }
  }, [open])

  // GAP-06: Recent articles — articles with nonzero progress, sorted by last-read timestamp
  const recentArticles = useMemo(() => {
    return articles
      .map(a => {
        const ts = Number(safeGetItem(`article-last-read:${a.id}`) ?? 0)
        const pct = Number(safeGetItem(`article-progress-pct:${a.id}`) ?? 0)
        return { article: a, ts, pct }
      })
      .filter(x => x.ts > 0 || x.pct > 0)
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 5)
      .map(x => x.article)
  }, [articles])

  // GAP-05: Quick navigation actions
  const quickActions: QuickAction[] = useMemo(() => {
    if (!onSelectCategory) return []
    const chefCategories = categories.filter(c =>
      !['techniques', 'recipes', 'french-cuisine', 'histoire-culinaire', 'chiffres-gourmands'].includes(c.id)
    )
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
      ...chefCategories.slice(0, 6).map(c => ({
        id: `nav-${c.id}`,
        label: c.name,
        sublabel: c.description,
        icon: c.icon,
        action: () => { onSelectCategory(c.id); onClose() },
      })),
    ]
  }, [onSelectCategory, onClose])

  const articleResults: ArticleMeta[] = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      // GAP-06: show recent articles first, then fill to 8 with latest
      if (recentArticles.length > 0) return recentArticles
      return articles.slice(0, 8)
    }
    return fuse.search(trimmed, { limit: 10 }).map((r) => r.item)
  }, [articles, fuse, query, recentArticles])

  // Combined list for keyboard navigation: quick actions (when empty query) + article results
  const showQuickActions = !query.trim() && quickActions.length > 0
  const totalItems = (showQuickActions ? quickActions.length : 0) + articleResults.length

  useEffect(() => {
    setActiveIndex(0)
  }, [articleResults.length, query])

  useEffect(() => {
    const buttons = listRef.current?.querySelectorAll('button[data-item]')
    const el = buttons?.[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      const container = containerRef.current
      if (!container) return
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(
          'input, button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.closest('[aria-hidden]'))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
      return
    }
    if (totalItems === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, totalItems - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (showQuickActions && activeIndex < quickActions.length) {
        quickActions[activeIndex].action()
      } else {
        const articleIdx = showQuickActions ? activeIndex - quickActions.length : activeIndex
        const item = articleResults[articleIdx]
        if (item) { onClose(); onOpenArticle(item) }
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [totalItems, showQuickActions, quickActions, articleResults, activeIndex, onClose, onOpenArticle])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]"
          style={{ background: 'rgba(10,9,8,0.85)', backdropFilter: 'blur(16px)' }}
          initial={shouldReduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={shouldReduce ? { duration: 0 } : { duration: 0.16 }}
          onClick={onClose}
        >
          <motion.div
            ref={containerRef}
            className="w-full max-w-xl overflow-hidden"
            style={{
              background: 'var(--bg-command)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.04) inset',
            }}
            initial={shouldReduce ? false : { y: -16, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={shouldReduce ? { opacity: 0 } : { y: -10, scale: 0.98, opacity: 0 }}
            transition={shouldReduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4">
              <svg
                className="h-3.5 w-3.5 shrink-0"
                style={{ opacity: 0.28 }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск материалов, шефов, техник..."
                className="flex-1 bg-transparent text-[14px] font-light tracking-wide outline-none placeholder:text-stone-600"
                style={{ caretColor: 'var(--text-accent)' }}
              />
              <button
                onClick={onClose}
                className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-700 transition hover:text-stone-400"
              >
                ESC
              </button>
            </div>

            {/* Separator */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

            {/* Results */}
            <div ref={listRef} className="max-h-[56vh] overflow-y-auto">

              {/* GAP-05: Quick navigation — shown at empty query */}
              {showQuickActions && (
                <div>
                  <div className="px-5 pb-1 pt-3">
                    <span className="font-mono text-[8px] uppercase tracking-[0.36em] text-stone-600">
                      Перейти
                    </span>
                  </div>
                  <div className="pb-1">
                    {quickActions.map((action, idx) => {
                      const isActive = idx === activeIndex
                      return (
                        <button
                          key={action.id}
                          type="button"
                          data-item
                          onClick={action.action}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className="flex w-full items-center gap-3 px-5 py-2.5 text-left"
                          style={{
                            background: isActive ? 'rgba(255,255,255,0.035)' : 'transparent',
                            borderLeft: isActive ? '2px solid var(--text-accent)' : '2px solid transparent',
                            transition: 'all 0.08s ease',
                          }}
                        >
                          <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center font-mono text-[7px] font-bold uppercase"
                            style={{
                              background: isActive ? 'var(--text-accent)' : 'rgba(255,255,255,0.05)',
                              color: isActive ? '#0a0908' : 'rgba(255,255,255,0.3)',
                              transition: 'all 0.08s ease',
                            }}
                          >
                            {action.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-normal text-stone-300">{action.label}</p>
                            {action.sublabel && (
                              <p className="truncate font-mono text-[9px] text-stone-600">{action.sublabel}</p>
                            )}
                          </div>
                          <svg className="h-3 w-3 shrink-0 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 20px' }} />
                </div>
              )}

              {/* Article results */}
              {articleResults.length > 0 && (
                <div className="px-5 pb-1 pt-3">
                  <span className="font-mono text-[8px] uppercase tracking-[0.36em] text-stone-600">
                    {query.trim()
                      ? `${articleResults.length} ${pluralRu(articleResults.length, RESULT)}`
                      : recentArticles.length > 0 ? 'Недавно читали' : 'Материалы'
                    }
                  </span>
                </div>
              )}

              <div className="pb-2">
                {articleResults.map((article, idx) => {
                  const category = categories.find((c) => c.id === article.category)
                  const globalIdx = showQuickActions ? quickActions.length + idx : idx
                  const isActive = globalIdx === activeIndex
                  return (
                    <button
                      key={article.id}
                      type="button"
                      data-item
                      onClick={() => { onClose(); onOpenArticle(article) }}
                      onMouseEnter={() => setActiveIndex(globalIdx)}
                      className="flex w-full items-start gap-3 px-5 py-3 text-left"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.035)' : 'transparent',
                        borderLeft: isActive ? '2px solid var(--text-accent)' : '2px solid transparent',
                        transition: 'all 0.08s ease',
                      }}
                    >
                      {/* GAP-01: Article thumbnail */}
                      {article.image ? (
                        <div className="mt-0.5 h-11 w-11 shrink-0 overflow-hidden bg-stone-800">
                          <img
                            src={article.image}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <span
                          className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center font-mono text-[7px] font-bold uppercase"
                          style={{
                            background: isActive ? 'var(--text-accent)' : 'rgba(255,255,255,0.05)',
                            color: isActive ? '#0a0908' : 'rgba(255,255,255,0.3)',
                            transition: 'all 0.08s ease',
                          }}
                        >
                          {category?.icon ?? '·'}
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-normal leading-snug text-stone-200">
                          <Highlight text={article.title} pattern={query} />
                        </p>
                        {/* GAP-04: Category name + author */}
                        <p className="mt-0.5 truncate font-mono text-[9px] text-stone-600">
                          <span style={{ color: 'rgba(255,255,255,0.2)' }}>{category?.icon ?? '·'}</span>
                          {' '}
                          <span>{category?.name ?? article.category}</span>
                          {' · '}
                          <span>{article.readTime} мин</span>
                        </p>
                        {/* GAP-02: Excerpt when active */}
                        {isActive && article.excerpt && (
                          <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-stone-500">
                            {article.excerpt}
                          </p>
                        )}
                        {/* GAP-03: Tags */}
                        {isActive && (article.tags ?? []).length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {(article.tags ?? []).slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="border border-stone-700 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-stone-500"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}

                {articleResults.length === 0 && query.trim() && (
                  <div className="px-5 py-12 text-center">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-600">
                      Ничего не найдено
                    </p>
                    <p className="mt-1.5 text-[11px] text-stone-700">«{query}»</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-5 py-2.5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center gap-4 font-mono text-[8px] uppercase tracking-[0.26em] text-stone-700">
                <span>↑↓ навигация</span>
                <span>↵ открыть</span>
              </div>
              <span className="font-mono text-[8px] uppercase tracking-[0.26em] text-stone-700">
                {articles.length}&thinsp;{pluralRu(articles.length, MATERIAL)}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
