import type { ReactNode } from 'react'

/**
 * Подсвечивает совпадения поискового запроса внутри текста.
 * Возвращает React-узел с выделенными span.
 */
export function highlightMatch(text: string, query: string): ReactNode {
  if (!query.trim()) return text

  const escaped = query.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <mark
            key={i}
            className="rounded-sm px-0.5 font-medium transition-colors"
            style={{
              backgroundColor: 'var(--text-accent)',
              color: 'var(--bg-main)',
              opacity: 0.85,
            }}
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  )
}
