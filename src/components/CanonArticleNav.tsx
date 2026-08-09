import { canonActs, canonWorks } from '../data/canon'
import { prefetchRoute } from '../utils/navigation'

const pad = (value: number) => String(value).padStart(2, '0')

const destinationFor = (work: (typeof canonWorks)[number]) =>
  work.articleId ? `/articles/${work.articleId}/` : `/canon/#canon-${work.id}`

const intentProps = (href: string) => ({
  onPointerEnter: (event: React.PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType === 'mouse') prefetchRoute(href)
  },
  onFocus: () => prefetchRoute(href),
})

interface CanonArticleNavProps {
  articleId: string
  placement: 'top' | 'bottom'
}

export default function CanonArticleNav({ articleId, placement }: CanonArticleNavProps) {
  const index = canonWorks.findIndex((work) => work.articleId === articleId)
  if (index < 0) return null

  const current = canonWorks[index]
  const act = canonActs.find((item) => item.id === current.act)
  const previous = index > 0 ? canonWorks[index - 1] : null
  const next = index < canonWorks.length - 1 ? canonWorks[index + 1] : null

  if (placement === 'top') {
    return (
      <aside className="border-b border-amber-900/10 bg-stone-950 px-4 text-amber-50 sm:px-6 dark:border-amber-100/10" aria-label="Эта статья входит в Le Canon Sucré">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <a href="/canon/" {...intentProps('/canon/')} className="group inline-flex items-center gap-3 no-underline">
            <span className="font-mono text-[8px] uppercase tracking-[0.26em] text-amber-200/55 transition group-hover:text-amber-200">Le Canon Sucré</span>
            <span className="h-px w-8 bg-amber-200/20 transition-all duration-500 group-hover:w-12 group-hover:bg-amber-200/50" aria-hidden="true" />
            <span className="font-serif text-sm text-amber-50/80 transition group-hover:text-amber-50">{current.name}</span>
          </a>
          <div className="flex items-center gap-3 font-mono text-[8px] uppercase tracking-[0.22em] text-stone-500">
            <span>{pad(current.order)} / {pad(canonWorks.length)}</span>
            {act && <><span aria-hidden="true">·</span><span>Acte {act.roman} · {act.title}</span></>}
          </div>
        </div>
      </aside>
    )
  }

  const previousDestination = previous ? destinationFor(previous) : null
  const nextDestination = next ? destinationFor(next) : null

  return (
    <nav className="border-t border-amber-900/10 bg-stone-950 px-4 py-12 text-amber-50 sm:px-6 sm:py-16 dark:border-amber-100/10" aria-label="Навигация по Le Canon Sucré">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-6 border-b border-amber-100/10 pb-5">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-amber-200/50">Le Canon Sucré</p>
            <p className="mt-2 font-serif text-2xl tracking-[-0.035em] text-amber-50 sm:text-3xl">{pad(current.order)} · {current.name}</p>
          </div>
          <a href="/canon/" {...intentProps('/canon/')} className="shrink-0 font-mono text-[8px] uppercase tracking-[0.2em] text-amber-200/55 transition hover:text-amber-200">Voir l’index →</a>
        </div>

        <div className="grid gap-px bg-amber-100/10 sm:grid-cols-2">
          {previous && previousDestination ? (
            <a href={previousDestination} {...intentProps(previousDestination)} className="group flex min-h-28 flex-col justify-between bg-stone-950 p-5 transition hover:bg-stone-900 sm:p-6">
              <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-stone-500">← Précédent · {pad(previous.order)}</span>
              <span className="mt-5 font-serif text-xl tracking-[-0.03em] text-amber-50/75 transition group-hover:text-amber-50 sm:text-2xl">{previous.name}</span>
            </a>
          ) : <span className="hidden bg-stone-950 sm:block" aria-hidden="true" />}

          {next && nextDestination ? (
            <a href={nextDestination} {...intentProps(nextDestination)} className="group flex min-h-28 flex-col items-end justify-between bg-stone-950 p-5 text-right transition hover:bg-stone-900 sm:p-6">
              <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-stone-500">Suivant · {pad(next.order)} →</span>
              <span className="mt-5 font-serif text-xl tracking-[-0.03em] text-amber-50/75 transition group-hover:text-amber-50 sm:text-2xl">{next.name}</span>
            </a>
          ) : <span className="hidden bg-stone-950 sm:block" aria-hidden="true" />}
        </div>
      </div>
    </nav>
  )
}
