import { type Category } from '../data/categories'

interface Props {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (id: string | null) => void
  /** Category id currently visible in the viewport (scroll-spy from ArticlesGrid) */
  activeSectionId?: string | null
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function DepartmentSidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  activeSectionId,
  mobileOpen,
  onMobileClose,
}: Props) {
  // When a filter is active, that takes priority for the highlight.
  // When browsing freely (no filter), highlight the scroll-spy section.
  const highlightId = selectedCategory ?? activeSectionId

  const buttonClass = (id: string | null) => {
    const isSelected = id === null ? !selectedCategory : selectedCategory === id
    const isScrollActive = !selectedCategory && id !== null && activeSectionId === id

    if (isSelected) {
      return 'bg-stone-950 text-amber-100 dark:bg-stone-100 dark:text-stone-950'
    }
    if (isScrollActive) {
      // Subtle highlight: no solid fill, but stronger text and a left accent border
      return 'border-l-2 border-amber-700 pl-[14px] text-stone-950 dark:border-amber-500 dark:text-amber-100'
    }
    return 'text-stone-600 hover:text-stone-950 dark:text-stone-400 dark:hover:text-amber-100'
  }

  const content = (
    <nav className="flex flex-col gap-0.5 py-2">
      <button
        onClick={() => onSelectCategory(null)}
        className={`px-4 py-2 text-left font-mono text-xs uppercase tracking-[0.18em] transition rounded ${buttonClass(null)}`}
      >
        Все
      </button>
      {categories.map(c => (
        <button
          key={c.id}
          onClick={() => onSelectCategory(c.id)}
          className={`px-4 py-2 text-left font-mono text-xs uppercase tracking-[0.18em] transition rounded ${buttonClass(c.id)}`}
        >
          {c.name}
        </button>
      ))}
    </nav>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-56 shrink-0">{content}</aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[var(--bg-main)] dark:bg-stone-950 shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 border-b border-stone-950/10 dark:border-stone-800">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">
                Категории
              </span>
              <button
                onClick={onMobileClose}
                aria-label="Закрыть"
                className="text-stone-500 hover:text-stone-950 dark:hover:text-amber-100"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  )
}
