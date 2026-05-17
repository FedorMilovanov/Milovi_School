import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fallbackImageFor } from '../assets/images'
import type { ArticleMeta } from '../data/types'
import type { Category } from '../data/categories'
import ImageWithFade from './ImageWithFade'
import type { FuseResultMatch } from 'fuse.js'
import { highlightMatch, highlightWithMatches } from '../utils/highlight'
import { pluralRu, MATERIAL } from '../utils/plural'

// ── Convenience wrapper: picks Fuse-index highlight when match data exists, ───
// falls back to literal substring split otherwise. Using Fuse indices fixes
// the bug where transliteration / fuzzy matches produced no highlight at all.
function HL({
  text, field, matchMap, articleId, query,
}: {
  text: string
  field: string
  matchMap?: Map<string, ReadonlyArray<FuseResultMatch>>
  articleId: string
  query: string
}) {
  const matches = matchMap?.get(articleId)
  if (matches) return <>{highlightWithMatches(text, matches, field)}</>
  return <>{highlightMatch(text, query)}</>
}

// ─── How many articles to preview per section before "Show all" ───────────────
const SECTION_PREVIEW = 5

interface ArticlesGridProps {
  articles: ArticleMeta[]
  allArticles: ArticleMeta[]
  onArticleClick: (article: ArticleMeta) => void
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (id: string | null) => void
  searchQuery?: string
  /** Fuse.js match data keyed by article id — enables accurate fuzzy highlighting */
  matchMap?: Map<string, ReadonlyArray<FuseResultMatch>>
}

// ─── Compact list card (right column) ─────────────────────────────────────────
function CompactCard({ article, categories, onArticleClick, searchQuery = '', matchMap }: {
  article: ArticleMeta
  categories: Category[]
  onArticleClick: (a: ArticleMeta) => void
  searchQuery?: string
  matchMap?: Map<string, ReadonlyArray<FuseResultMatch>>
}) {
  const cat = categories.find(c => c.id === article.category)
  return (
    <a
      href={`/articles/${article.id}/`}
      onClick={(e) => { if (!(e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) { e.preventDefault(); onArticleClick(article) } }}
      className="group flex w-full items-start gap-4 border-b border-[var(--border-subtle)] py-4 text-left last:border-b-0 transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center bg-stone-950 font-mono text-[6px] font-bold uppercase text-amber-100 dark:bg-amber-100 dark:text-stone-950">
            {cat?.icon ?? '·'}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-stone-500">
            {article.readTime} мин
          </span>
        </div>
        <h4 className="font-serif text-[15px] font-semibold leading-snug tracking-[-0.03em] text-stone-950 transition group-hover:text-amber-800 dark:text-stone-100 dark:group-hover:text-amber-200 line-clamp-2 kinetic-text">
          <HL text={article.title} field="title" matchMap={matchMap} articleId={article.id} query={searchQuery} />
        </h4>
      </div>
      <svg className="mt-1 h-3.5 w-3.5 shrink-0 text-stone-300 opacity-0 transition group-hover:opacity-100 dark:text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    </a>
  )
}

// ─── Featured (hero) card in a section ────────────────────────────────────────
function FeaturedCard({ article, categories, onArticleClick, searchQuery = '', matchMap, isFirst = false }: {
  article: ArticleMeta
  categories: Category[]
  onArticleClick: (a: ArticleMeta) => void
  searchQuery?: string
  matchMap?: Map<string, ReadonlyArray<FuseResultMatch>>
  isFirst?: boolean
}) {
  const cat = categories.find(c => c.id === article.category)
  return (
    <motion.a
      href={`/articles/${article.id}/`}
      onClick={(e) => { if (!(e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) { e.preventDefault(); onArticleClick(article) } }}
      className="haptic-btn group relative flex flex-col w-full overflow-hidden text-left"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55 }}
    >
      <div className="relative overflow-hidden">
        <ImageWithFade
          src={article.image || fallbackImageFor(article.category)}
          alt={article.imageAlt ?? article.title}
          className="h-64 w-full transition-transform duration-700 group-hover:scale-[1.03] sm:h-80"
          lazy={false}
          fetchPriority={isFirst ? "high" : "auto"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4">
          <span className="flex h-5 w-5 items-center justify-center bg-stone-950 font-mono text-[7px] font-bold uppercase text-amber-100 dark:bg-amber-100 dark:text-stone-950">
            {cat?.icon ?? '·'}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2 pt-4">
        <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.28em] text-stone-500">
          <span>{cat?.name ?? 'Patisserie'}</span>
          <span>·</span>
          <span>{article.readTime} мин</span>
        </div>
        <h3 className="font-serif text-xl font-semibold leading-[1.2] tracking-[-0.04em] text-stone-950 transition group-hover:text-amber-800 dark:text-stone-100 dark:group-hover:text-amber-200 sm:text-2xl kinetic-text">
          <HL text={article.title} field="title" matchMap={matchMap} articleId={article.id} query={searchQuery} />
        </h3>
        <p className="text-sm leading-6 text-stone-600 dark:text-stone-400 line-clamp-2">
          <HL text={article.excerpt ?? ''} field="excerpt" matchMap={matchMap} articleId={article.id} query={searchQuery} />
        </p>
        <span className="mt-1 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.24em] text-amber-800 dark:text-amber-300">
          Читать
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </div>
    </motion.a>
  )
}

// ─── Secondary card (smaller, for the 2/3 grid) ───────────────────────────────
function SecondaryCard({ article, categories, onArticleClick, searchQuery = '', matchMap }: {
  article: ArticleMeta
  categories: Category[]
  onArticleClick: (a: ArticleMeta) => void
  searchQuery?: string
  matchMap?: Map<string, ReadonlyArray<FuseResultMatch>>
}) {
  const cat = categories.find(c => c.id === article.category)
  return (
    <motion.a
      href={`/articles/${article.id}/`}
      onClick={(e) => { if (!(e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) { e.preventDefault(); onArticleClick(article) } }}
      className="group flex w-full items-start gap-4 text-left"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden sm:h-24 sm:w-24">
        <ImageWithFade
          src={article.image || fallbackImageFor(article.category)}
          alt={article.imageAlt ?? article.title}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <div className="mb-1 flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-stone-500">
            {cat?.name ?? 'PR'} · {article.readTime} мин
          </span>
        </div>
        <h4 className="font-serif text-sm font-semibold leading-snug tracking-[-0.02em] text-stone-950 transition group-hover:text-amber-800 dark:text-stone-100 dark:group-hover:text-amber-200 line-clamp-3 kinetic-text">
          <HL text={article.title} field="title" matchMap={matchMap} articleId={article.id} query={searchQuery} />
        </h4>
      </div>
    </motion.a>
  )
}

// ─── Index row (flat list mode) ────────────────────────────────────────────────
function IndexRow({ article, index, categories, onArticleClick, searchQuery = '', matchMap }: {
  article: ArticleMeta
  index: number
  categories: Category[]
  onArticleClick: (a: ArticleMeta) => void
  searchQuery?: string
  matchMap?: Map<string, ReadonlyArray<FuseResultMatch>>
}) {
  const cat = categories.find(c => c.id === article.category)
  return (
    <motion.a
      href={`/articles/${article.id}/`}
      onClick={(e) => { if (!(e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) { e.preventDefault(); onArticleClick(article) } }}
      className="group grid w-full gap-4 border-b border-[var(--border-subtle)] py-4 text-left transition hover:border-stone-400 sm:grid-cols-[3rem_1fr_auto] sm:items-center dark:hover:border-stone-600"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.015, 0.3) }}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-stone-300 dark:text-stone-700">{String(index + 1).padStart(2, '0')}</span>
      <span>
        <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-[0.22em] text-stone-500">{cat?.name} · {article.readTime} мин</span>
        <span className="block font-serif text-[17px] font-semibold leading-tight tracking-[-0.03em] text-stone-950 transition group-hover:text-amber-800 dark:text-stone-100 dark:group-hover:text-amber-200">
          <HL text={article.title} field="title" matchMap={matchMap} articleId={article.id} query={searchQuery} />
        </span>
      </span>
      <svg className="hidden h-4 w-4 text-stone-300 transition group-hover:text-amber-700 dark:text-stone-700 dark:group-hover:text-amber-300 sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    </motion.a>
  )
}

// ─── One category section ──────────────────────────────────────────────────────
function CategorySection({ categoryId, articles, allCount, category, categories, onArticleClick, onSelectCategory, searchQuery, matchMap }: {
  categoryId: string
  articles: ArticleMeta[]
  allCount: number
  category: Category | undefined
  categories: Category[]
  onArticleClick: (a: ArticleMeta) => void
  onSelectCategory: (id: string | null) => void
  searchQuery: string
  matchMap?: Map<string, ReadonlyArray<FuseResultMatch>>
}) {
  const [expanded, setExpanded] = useState(false)
  const preview = expanded ? articles : articles.slice(0, SECTION_PREVIEW)
  const hasMore = articles.length > SECTION_PREVIEW

  // layout: featured + right-column list (first 1 featured, next 2 compact right, then 2 secondary below)
  const featured = preview[0]
  const rightList = preview.slice(1, 3)
  const bottomRow = preview.slice(3, 5)
  const extras = preview.slice(5)

  return (
    <motion.section
      data-category={categoryId}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
      className="border-t border-[var(--border-subtle)] pt-10"
    >
      {/* Section header */}
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.36em] text-amber-800 dark:text-amber-300">
            {category?.icon} / {category?.name}
          </p>
          <h2 className="font-serif text-2xl font-semibold leading-tight tracking-[-0.045em] text-stone-950 dark:text-stone-100 sm:text-3xl">
            {category?.description ?? category?.name}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-3 pt-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-stone-400">{allCount} мат.</span>
          <button
            type="button"
            onClick={() => onSelectCategory(categoryId)}
            className="border border-[var(--border-subtle)] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-stone-500 transition hover:border-stone-400 hover:text-stone-950 dark:hover:border-stone-600 dark:hover:text-amber-100"
          >
            Все →
          </button>
        </div>
      </div>

      {/* Main layout: featured left, compact list right */}
      {articles.length === 1 ? (
        <FeaturedCard article={featured} categories={categories} onArticleClick={onArticleClick} searchQuery={searchQuery} matchMap={matchMap} />
      ) : (
        <div className="grid gap-8 sm:grid-cols-[1fr_320px]">
          {/* Featured */}
          <FeaturedCard article={featured} categories={categories} onArticleClick={onArticleClick} searchQuery={searchQuery} matchMap={matchMap} />

          {/* Compact right column */}
          {rightList.length > 0 && (
            <div className="flex flex-col border-l border-[var(--border-subtle)] pl-8">
              {rightList.map(a => (
                <CompactCard key={a.id} article={a} categories={categories} onArticleClick={onArticleClick} searchQuery={searchQuery} matchMap={matchMap} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom row — secondary cards */}
      {bottomRow.length > 0 && (
        <div className="mt-7 grid gap-6 border-t border-[var(--border-subtle)] pt-7 sm:grid-cols-2">
          {bottomRow.map(a => (
            <SecondaryCard key={a.id} article={a} categories={categories} onArticleClick={onArticleClick} searchQuery={searchQuery} matchMap={matchMap} />
          ))}
        </div>
      )}

      {/* Extra articles when expanded */}
      <AnimatePresence>
        {expanded && extras.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-6 grid gap-6 overflow-hidden sm:grid-cols-2"
          >
            {extras.map(a => (
              <SecondaryCard key={a.id} article={a} categories={categories} onArticleClick={onArticleClick} searchQuery={searchQuery} matchMap={matchMap} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show more / less */}
      {hasMore && (
        <div className="mt-7 flex items-center gap-6 border-t border-[var(--border-subtle)] pt-5">
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="font-mono text-[10px] uppercase tracking-[0.28em] text-stone-500 transition hover:text-stone-950 dark:hover:text-amber-100"
          >
            {expanded ? '← Свернуть' : `Ещё ${articles.length - SECTION_PREVIEW} ${pluralRu(articles.length - SECTION_PREVIEW, MATERIAL)}`}
          </button>
          <button
            type="button"
            onClick={() => onSelectCategory(categoryId)}
            className="font-mono text-[10px] uppercase tracking-[0.28em] text-stone-400 transition hover:text-stone-700 dark:hover:text-stone-300"
          >
            Только {category?.name} →
          </button>
        </div>
      )}
    </motion.section>
  )
}

// ─── Single-category journal view ─────────────────────────────────────────────
function JournalView({ articles, categories, onArticleClick, searchQuery, matchMap }: {
  articles: ArticleMeta[]
  categories: Category[]
  onArticleClick: (a: ArticleMeta) => void
  searchQuery: string
  matchMap?: Map<string, ReadonlyArray<FuseResultMatch>>
}) {
  return (
    <div className="space-y-10">
      {articles.map((article, i) => {
        const cat = categories.find(c => c.id === article.category)
        return (
          <motion.a
            key={article.id}
            href={`/articles/${article.id}/`}
            onClick={(e) => { if (!(e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) { e.preventDefault(); onArticleClick(article) } }}
            className="group grid w-full cursor-pointer gap-6 border-b border-[var(--border-subtle)] pb-10 text-left sm:grid-cols-[280px_1fr]"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: Math.min(i * 0.04, 0.2) }}
          >
            <ImageWithFade
              src={article.image || fallbackImageFor(article.category)}
              alt={article.imageAlt ?? article.title}
              className="h-52 w-full transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.26em] text-stone-500">
                <span className="flex h-4 w-4 items-center justify-center bg-stone-950 text-[6px] font-bold text-amber-100 dark:bg-amber-100 dark:text-stone-950">{cat?.icon ?? '·'}</span>
                <span>{cat?.name}</span>
                <span>·</span>
                <span>{article.readTime} мин</span>
              </div>
              <h3 className="font-serif text-2xl font-semibold leading-[1.15] tracking-[-0.04em] text-stone-950 transition group-hover:text-amber-800 dark:text-stone-100 dark:group-hover:text-amber-200 kinetic-text">
                <HL text={article.title} field="title" matchMap={matchMap} articleId={article.id} query={searchQuery} />
              </h3>
              <p className="text-sm leading-6 text-stone-600 dark:text-stone-400 line-clamp-3">
                <HL text={article.excerpt ?? ''} field="excerpt" matchMap={matchMap} articleId={article.id} query={searchQuery} />
              </p>
              <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-amber-800 dark:text-amber-300">
                Читать исследование
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </div>
          </motion.a>
        )
      })}
    </div>
  )
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function ArticlesGrid({
  articles, allArticles, onArticleClick, categories,
  selectedCategory, onSelectCategory, searchQuery = '', matchMap,
}: ArticlesGridProps) {
  const [viewMode, setViewMode] = useState<'magazine' | 'index'>('magazine')
  const nonEmptyCategories = useMemo(() => {
    const ids = new Set(allArticles.map(a => a.category))
    return categories.filter(c => ids.has(c.id))
  }, [allArticles, categories])

  const groupedByCategory = useMemo(() => {
    const map = new Map<string, ArticleMeta[]>()
    for (const cat of nonEmptyCategories) {
      const catArticles = articles.filter(a => a.category === cat.id)
      if (catArticles.length > 0) map.set(cat.id, catArticles)
    }
    return map
  }, [articles, nonEmptyCategories])

  // Count all articles per category from allArticles for "N мат." badge
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of allArticles) map.set(a.category, (map.get(a.category) ?? 0) + 1)
    return map
  }, [allArticles])

  const isFiltered = Boolean(selectedCategory || searchQuery.trim())

  return (
    <section id="articles" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      {/* NEW-IMP-B: aria-live region — screen readers announce filter results */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {(searchQuery.trim() || selectedCategory)
          ? `Найдено ${articles.length} ${pluralRu(articles.length, MATERIAL)}`
          : ''}
      </div>

      {/* Section header */}
      <div className="mb-10 flex flex-col gap-5 border-y border-[var(--border-subtle)] py-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.34em] text-amber-800 dark:text-amber-300">
            Библиотека чтения
          </p>
          <h2 className="font-serif text-4xl font-semibold tracking-[-0.06em] text-stone-950 dark:text-stone-100 sm:text-5xl">
            {articles.length}&thinsp;
            <span className="text-stone-300 dark:text-stone-700">
              {pluralRu(articles.length, MATERIAL)}
            </span>
          </h2>
          {/* GAP-09: show result count when filtering */}
          {(searchQuery.trim() || selectedCategory) && (
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.24em] text-stone-400 dark:text-stone-600">
              {articles.length === 0
                ? 'Ничего не найдено — попробуйте другой запрос'
                : `Найдено: ${articles.length} ${pluralRu(articles.length, MATERIAL)}`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedCategory && (
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className="border border-[var(--border-subtle)] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-stone-500 transition hover:text-stone-950 dark:hover:text-amber-100"
            >
              ← Все разделы
            </button>
          )}
          {/* FIX: show context label when filtered instead of silently hiding the mode toggle */}
          {isFiltered && searchQuery.trim() && (
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-stone-400 dark:text-stone-600">
              Результаты поиска
            </span>
          )}
          {!isFiltered && (
            <div className="flex border border-[var(--border-subtle)]">
              {(['magazine', 'index'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-3.5 py-2 font-mono text-[9px] uppercase tracking-[0.24em] transition ${viewMode === mode ? 'bg-stone-950 text-amber-50 dark:bg-amber-100 dark:text-stone-950' : 'text-stone-500 hover:text-stone-950 dark:text-stone-400 dark:hover:text-amber-100'}`}
                >
                  {mode === 'magazine' ? 'Редакция' : 'Индекс'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {articles.length === 0 && (
        <div className="py-24 text-center">
          <p className="font-serif text-3xl font-semibold tracking-[-0.04em] text-stone-200 dark:text-stone-800">Ничего не найдено</p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.26em] text-stone-400">Попробуйте изменить запрос или сбросить фильтры</p>
        </div>
      )}

      {/* Filtered / single-category journal */}
      {articles.length > 0 && isFiltered && (
        <JournalView articles={articles} categories={categories} onArticleClick={onArticleClick} searchQuery={searchQuery} matchMap={matchMap} />
      )}

      {/* Index mode */}
      {articles.length > 0 && !isFiltered && viewMode === 'index' && (
        <div>
          {articles.map((a, i) => (
            <IndexRow key={a.id} article={a} index={i} categories={categories} onArticleClick={onArticleClick} searchQuery={searchQuery} matchMap={matchMap} />
          ))}
        </div>
      )}

      {/* Magazine mode — grouped by category */}
      {articles.length > 0 && !isFiltered && viewMode === 'magazine' && (
        <div className="space-y-16">
          {Array.from(groupedByCategory.entries()).map(([catId, catArticles]) => {
            const cat = categories.find(c => c.id === catId)
            return (
              <CategorySection
                key={catId}
                categoryId={catId}
                articles={catArticles}
                allCount={categoryCounts.get(catId) ?? catArticles.length}
                matchMap={matchMap}
                category={cat}
                categories={categories}
                onArticleClick={onArticleClick}
                onSelectCategory={onSelectCategory}
                searchQuery={searchQuery}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
