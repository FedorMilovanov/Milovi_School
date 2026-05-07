import { pluralRu, MATERIAL } from '../utils/plural'

interface ArchiveToolbarProps {
  resultCount: number
  availableTags: string[]
  activeTag: string | null
  onSelectTag: (tag: string | null) => void
  sortBy: 'relevance' | 'readTime' | 'title' | 'latest'
  onSortChange: (value: 'relevance' | 'readTime' | 'title' | 'latest') => void
  hasActiveFilters: boolean
  onReset: () => void
}

export default function ArchiveToolbar({
  resultCount,
  availableTags,
  activeTag,
  onSelectTag,
  sortBy,
  onSortChange,
  hasActiveFilters,
  onReset,
}: ArchiveToolbarProps) {
  return (
    <section className="px-6 pb-8" style={{ backgroundColor: 'var(--bg-main)' }}>
      <div
        className="mx-auto max-w-7xl border-b pb-8"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Tags + count */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="font-mono text-[10px] uppercase tracking-[0.28em]"
                style={{ color: 'var(--text-muted)' }}
              >
                Найдено {resultCount}&thinsp;{pluralRu(resultCount, MATERIAL)}
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onReset}
                  className="border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] transition cursor-pointer"
                  style={{ borderColor: 'var(--text-accent)', color: 'var(--text-accent)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--text-accent)'
                    e.currentTarget.style.color = 'var(--bg-main)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--text-accent)'
                  }}
                >
                  Сбросить всё
                </button>
              )}
            </div>

            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const active = activeTag === tag
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onSelectTag(active ? null : tag)}
                      className="border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition cursor-pointer"
                      style={{
                        borderColor: active ? 'var(--text-accent)' : 'var(--border-subtle)',
                        backgroundColor: active ? 'var(--text-accent)' : 'transparent',
                        color: active ? 'var(--bg-main)' : 'var(--text-muted)',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.borderColor = 'var(--text-primary)'
                          e.currentTarget.style.color = 'var(--text-primary)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.borderColor = 'var(--border-subtle)'
                          e.currentTarget.style.color = 'var(--text-muted)'
                        }
                      }}
                    >
                      #{tag}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3 self-start lg:self-auto">
            <label
              htmlFor="archive-sort"
              className="font-mono text-[10px] uppercase tracking-[0.24em]"
              style={{ color: 'var(--text-muted)' }}
            >
              Сортировка
            </label>
            <select
              id="archive-sort"
              value={sortBy}
              onChange={(e) =>
                onSortChange(
                  e.target.value as 'relevance' | 'readTime' | 'title' | 'latest',
                )
              }
              className="border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] focus:outline-none cursor-pointer"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-deep)',
              }}
            >
              <option value="relevance">По релевантности</option>
              <option value="latest">По новизне</option>
              <option value="readTime">По длительности</option>
              <option value="title">По алфавиту</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  )
}
