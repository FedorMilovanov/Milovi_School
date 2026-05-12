import { useEffect, useState } from 'react'
import type { ArticleMeta } from '../data/articles'
import { categories } from '../data/categories'
import { safeGetItem } from '../utils/storage'

interface ContinueReadingProps {
  articles: ArticleMeta[]
  onArticleClick: (article: ArticleMeta) => void
}

type ReadingItem = { article: ArticleMeta; progress: number; saved: boolean }
type ReadingItemWithTs = ReadingItem & { lastRead: number }

export default function ContinueReading({ articles, onArticleClick }: ContinueReadingProps) {
  // BUG-FIX: reading localStorage during render causes a hydration mismatch
  // because the SSG-rendered HTML has all values as 0/false while the browser
  // has real data. Move the read into useEffect so both server and client
  // first render are identical (empty list), then state is populated client-side.
  const [items, setItems] = useState<ReadingItem[]>([])

  useEffect(() => {
    const computed: ReadingItem[] = articles
      .map((article): ReadingItemWithTs => {
        const rawProgress = Number(safeGetItem(`article-progress-pct:${article.id}`) ?? 0)
        const progress = Number.isFinite(rawProgress) ? Math.min(100, Math.max(0, rawProgress)) : 0
        const saved = safeGetItem(`article-saved:${article.id}`) === 'true'
        // F-15: use last-read timestamp (set by ArticleView) as primary sort key
        const lastRead = Number(safeGetItem(`article-last-read:${article.id}`) ?? 0)
        return { article, progress, saved, lastRead }
      })
      .filter((item) => item.saved || item.progress > 0)
      // Primary: most recently visited; secondary: saved first; tertiary: most progress
      .sort((a, b) => {
        if (b.lastRead !== a.lastRead) return b.lastRead - a.lastRead
        return Number(b.saved) - Number(a.saved) || b.progress - a.progress
      })
      .slice(0, 4)
      .map(({ article, progress, saved }) => ({ article, progress, saved }))
    setItems(computed)
  }, [articles])

  if (items.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
      <div className="border-y border-[var(--border-subtle)] py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-800 dark:text-amber-200">Продолжить</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.05em] text-stone-950 dark:text-stone-100">Закладки и чтение</h2>
          </div>
          <p className="hidden max-w-xl text-sm leading-6 text-stone-500 dark:text-stone-400 sm:block">Локальная история чтения: открывайте материалы с того места, где остановились.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.map(({ article, progress, saved }) => (
            <a key={article.id} href={`/articles/${article.id}/`} onClick={(e) => { if (!(e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) { e.preventDefault(); onArticleClick(article) } }} className="group block w-full border border-[var(--border-subtle)] p-5 text-left transition-all duration-300 hover:border-stone-300 hover:shadow-md active:scale-[0.98] dark:hover:border-stone-600">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex h-5 w-5 items-center justify-center bg-stone-950 text-[7px] font-bold text-amber-100 dark:bg-amber-100 dark:text-stone-950">
                  {categories.find((c) => c.id === article.category)?.icon || '·'}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
                  {article.readTime} мин
                </span>
              </div>
              <h3 className="font-serif text-lg font-semibold leading-snug tracking-[-0.04em] text-stone-950 transition-colors group-hover:text-amber-800 dark:text-stone-100 dark:group-hover:text-amber-100">
                {article.title}
              </h3>
              <div className="mt-4 flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
                  {saved && progress === 0 ? 'Закладка' : `${progress}%`}
                </span>
                <div className="flex-1 h-px bg-stone-200 dark:bg-stone-800">
                  <div className="h-px bg-amber-600 transition-all duration-300" style={{ width: `${progress > 0 ? Math.max(progress, 8) : (saved ? 12 : 0)}%` }} />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
