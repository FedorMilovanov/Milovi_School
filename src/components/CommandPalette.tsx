import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Fuse from 'fuse.js'
import type { ArticleMeta } from '../data/articles'
import { categories } from '../data/categories'
import { pluralRu, MATERIAL, RESULT } from '../utils/plural'

interface CommandPaletteProps {
  open: boolean
  articles: ArticleMeta[]
  theme: 'light' | 'dark'
  onClose: () => void
  onOpenArticle: (article: ArticleMeta) => void
  onGoHome: () => void
  onGoCategories: () => void
  onGoArticles: () => void
  onToggleTheme: () => void
}

const fuse = new Fuse<ArticleMeta>([], {
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
})

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

export default function CommandPalette({ open, articles, onClose, onOpenArticle }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const articleResults: ArticleMeta[] = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) return articles.slice(0, 10)
    fuse.setCollection(articles)
    return fuse.search(trimmed, { limit: 10 }).map((r) => r.item)
  }, [articles, query])

  useEffect(() => {
    setActiveIndex(0)
  }, [articleResults.length, query])

  useEffect(() => {
    const buttons = listRef.current?.querySelectorAll('button')
    const el = buttons?.[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (articleResults.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, articleResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = articleResults[activeIndex]
      if (item) { onClose(); onOpenArticle(item) }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [articleResults, activeIndex, onClose, onOpenArticle])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]"
          style={{ background: 'rgba(10,9,8,0.85)', backdropFilter: 'blur(16px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-xl overflow-hidden"
            style={{
              background: 'var(--bg-command)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.04) inset',
            }}
            initial={{ y: -16, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -10, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input — clean, borderless */}
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
                onKeyDown={handleKeyDown}
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
            <div ref={listRef} className="max-h-[52vh] overflow-y-auto">
              {articleResults.length > 0 && (
                <div className="px-5 pb-1 pt-3">
                  <span className="font-mono text-[8px] uppercase tracking-[0.36em] text-stone-600">
                    {query.trim() ? `${articleResults.length} ${pluralRu(articleResults.length, RESULT)}` : 'Материалы'}
                  </span>
                </div>
              )}

              <div className="pb-2">
                {articleResults.map((article, idx) => {
                  const category = categories.find((c) => c.id === article.category)
                  const isActive = idx === activeIndex
                  return (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => { onClose(); onOpenArticle(article) }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className="flex w-full items-start gap-4 px-5 py-3 text-left"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.035)' : 'transparent',
                        borderLeft: isActive ? '2px solid var(--text-accent)' : '2px solid transparent',
                        transition: 'all 0.08s ease',
                      }}
                    >
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center font-mono text-[7px] font-bold uppercase"
                        style={{
                          background: isActive ? 'var(--text-accent)' : 'rgba(255,255,255,0.05)',
                          color: isActive ? '#0a0908' : 'rgba(255,255,255,0.3)',
                          transition: 'all 0.08s ease',
                        }}
                      >
                        {category?.icon ?? '·'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-normal leading-snug text-stone-200">
                          <Highlight text={article.title} pattern={query} />
                        </p>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-stone-600">
                          {article.author} · {article.readTime} мин
                        </p>
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
