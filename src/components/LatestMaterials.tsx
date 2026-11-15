import type { ArticleClientMeta } from '../data/types'
import { categories } from '../data/categories'

/**
 * "Последние материалы" — server-rendered index on the home page.
 *
 * Why it exists: home linked to the hubs (`/materials/`, `/history/`, `/canon/`)
 * and to zero article URLs — the 158 documents were reachable from `/` only
 * through a hub, so the strongest page in the site passed no link equity to any
 * of them. `ContinueReading` renders real anchors but only after hydration (it
 * reads localStorage), so at build time it renders nothing.
 *
 * Constraints kept deliberately:
 *  - plain `<a href>` rows, no images, no client state → zero hydration work,
 *    no LCP/CLS impact;
 *  - dates are formatted with a fixed month table instead of `Intl`, because
 *    Node's ICU and the browser's CLDR can disagree and that would surface as a
 *    hydration mismatch on the home page;
 *  - sorting is total (`date`, then `id`) so the build is reproducible.
 */

const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

function formatDate(value: string | undefined): string | null {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const day = Number(match[3])
  const month = MONTHS_GENITIVE[Number(match[2]) - 1]
  if (!month) return null
  return `${day} ${month} ${match[1]}`
}

const categoryName = new Map(categories.map((category) => [category.id, category.name]))

interface LatestMaterialsProps {
  readonly articles: readonly ArticleClientMeta[]
  readonly limit?: number
}

export default function LatestMaterials({ articles, limit = 6 }: LatestMaterialsProps) {
  const latest = [...articles]
    .filter((article) => Boolean(article.date))
    .sort((a, b) => {
      if (a.date !== b.date) return (b.date ?? '').localeCompare(a.date ?? '')
      return a.id.localeCompare(b.id)
    })
    .slice(0, limit)

  if (latest.length === 0) return null

  return (
    <section aria-labelledby="latest-materials-heading" className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-800 dark:text-amber-200">Свежее</p>
          <h2 id="latest-materials-heading" className="mt-2 font-serif text-3xl font-semibold tracking-[-0.05em] text-stone-950 dark:text-stone-100">
            Последние материалы
          </h2>
        </div>
        <a
          href="/materials/"
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600 underline decoration-stone-300 underline-offset-4 transition hover:text-amber-800 hover:decoration-amber-700 dark:text-stone-400 dark:hover:text-amber-200"
        >
          Все {articles.length} материалов →
        </a>
      </div>

      <ol className="divide-y divide-[var(--border-subtle)]">
        {latest.map((article) => {
          const date = formatDate(article.date)
          const name = categoryName.get(article.category)
          return (
            <li key={article.id}>
              <a
                href={`/articles/${article.id}/`}
                className="group flex flex-wrap items-baseline gap-x-4 gap-y-1 py-4 transition-colors hover:bg-[var(--bg-deep)]"
              >
                {date ? (
                  <time
                    dateTime={article.date}
                    className="w-32 shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-stone-500 dark:text-stone-400"
                  >
                    {date}
                  </time>
                ) : null}
                <span className="font-serif text-lg font-medium leading-snug tracking-[-0.02em] text-stone-900 group-hover:text-amber-800 dark:text-stone-100 dark:group-hover:text-amber-200">
                  {article.title}
                </span>
                <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                  {name ? `${name} · ` : ''}{article.readTime} мин
                </span>
              </a>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
