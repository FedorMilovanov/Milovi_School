import { motion } from 'framer-motion'
import type { ArticleMeta } from '../data/articles'
import type { Category } from '../data/categories'

interface CategoriesProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  allArticles: ArticleMeta[]
}

export default function Categories({ categories, selectedCategory, onSelectCategory, searchQuery, onSearchChange, allArticles }: CategoriesProps) {
  const countByCategory = (id: string) => allArticles.filter((article) => article.category === id).length

  return (
    <section id="archive" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="grid gap-10 border-y border-[var(--border-subtle)] py-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
        <div>
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.32em] text-amber-800 dark:text-amber-200">Навигация по архиву</p>
          <h2 className="font-serif text-5xl font-semibold tracking-[-0.06em] text-stone-950 dark:text-stone-100 md:text-7xl">Шефы, техники, кухня</h2>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Найти: пралине, choux, Испахан, ДКА, соусы..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full border-0 border-b border-stone-900 bg-transparent py-5 pr-12 font-serif text-xl text-stone-950 placeholder:text-stone-400 focus:outline-none focus:ring-0 dark:border-stone-700 dark:text-stone-100 md:text-2xl"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-0 top-1/2 -translate-y-1/2 border border-stone-900/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600 transition hover:bg-stone-950 hover:text-amber-100 dark:border-stone-700 dark:hover:bg-stone-900 dark:hover:text-amber-100"
            >
              Сброс
            </button>
          )}
        </div>
      </div>

      <div className="-mx-6 mt-8 overflow-x-auto px-6 pb-2 md:mx-0 md:overflow-visible md:px-0">
        <div className="flex min-w-max gap-x-8 gap-y-4 md:min-w-0 md:flex-wrap">
          <motion.button
            type="button"
            onClick={() => onSelectCategory(null)}
            className={`relative pb-2 font-mono text-xs uppercase tracking-[0.24em] transition ${selectedCategory === null ? 'text-stone-950 dark:text-stone-100' : 'text-stone-500 hover:text-stone-950 dark:hover:text-stone-100'}`}
            whileHover={{ x: 4 }}
          >
            Все материалы
            {selectedCategory === null && (
              <motion.span layoutId="category-underline" className="absolute inset-x-0 bottom-0 h-px bg-stone-950 dark:bg-stone-100" />
            )}
          </motion.button>
          {categories.map((category) => (
            <motion.button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.id)}
              className={`relative pb-2 font-mono text-xs uppercase tracking-[0.24em] transition ${selectedCategory === category.id ? 'text-stone-950 dark:text-stone-100' : 'text-stone-500 hover:text-stone-950 dark:hover:text-stone-100'}`}
              whileHover={{ x: 4 }}
            >
              {category.icon} / {category.name} <span className="text-stone-400">({countByCategory(category.id)})</span>
              {selectedCategory === category.id && (
                <motion.span layoutId="category-underline" className="absolute inset-x-0 bottom-0 h-px bg-stone-950 dark:bg-stone-100" />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}
