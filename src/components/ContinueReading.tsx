import { useEffect, useState } from 'react'
import type { ArticleMeta } from '../data/types'
import { categories } from '../data/categories'
import { safeGetItem } from '../utils/storage'

interface ContinueReadingProps {
  articles: ArticleMeta[]
  onArticleClick: (article: ArticleMeta) => void
}

type ReadingItem = { article: ArticleMeta; progress: number; saved: boolean }

export default function ContinueReading({ articles, onArticleClick }: ContinueReadingProps) {
  const [items, setItems] = useState<ReadingItem[]>([])

  useEffect(() => {
    const computed: ReadingItem[] = articles
      .map((article): ReadingItem & { lastRead: number; savedTs: number } => {
        const rawProgress = Number(safeGetItem(`article-progress-pct:${article.id}`) ?? 0)
        const progress = Number.isFinite(rawProgress) ? Math.min(100, Math.max(0, rawProgress)) : 0
        const saved = safeGetItem(`article-saved:${article.id}`) === 'true'
        const lastRead = Number(safeGetItem(`article-last-read:${article.id}`) ?? 0)
        // FIX H-4: Give saved items higher priority by using a high timestamp if saved
        const savedTs = saved ? Math.max(lastRead, Date.now() - 100000) : lastRead
        return { article, progress, saved, lastRead: savedTs }
      })
      .filter((item) => item.saved || item.progress > 0)
      // FIX H-4: Better sort — saved items first, then by recency, then progress
      .sort((a, b) => {
        if (a.saved !== b.saved) return b.saved ? 1 : -1
        if (b.lastRead !== a.lastRead) return b.lastRead - a.lastRead
        return b.progress - a.progress
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
