import type { ReactNode } from 'react'
import type { FuseResultMatch } from 'fuse.js'

// ── Style shared between both highlight functions ────────────────────────────
const MARK_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--text-accent)',
  color: 'var(--bg-main)',
  opacity: 0.85,
}
const MARK_CLASS = 'rounded-sm px-0.5 font-medium transition-colors'

// ── Fuse-index-based highlight (accurate fuzzy highlighting) ─────────────────
// Uses the match indices returned by Fuse.js (includeMatches: true).
// Works correctly even when the query isn't a literal substring of the text
// (e.g. «парис» → highlights the matched chars inside «Paris-Brest»).

function buildRanges(
  text: string,
  indices: ReadonlyArray<Readonly<[number, number]>>,
): ReactNode {
  const parts: ReactNode[] = []
  let last = 0
  const sorted = [...indices].sort((a, b) => a[0] - b[0])
  for (const [start, end] of sorted) {
    if (start > last) parts.push(text.slice(last, start))
    // Guard: Fuse can return indices that exceed the value string length
    const safeEnd = Math.min(end, text.length - 1)
    if (start <= safeEnd) {
      parts.push(
        <mark key={`${start}-${end}`} className={MARK_CLASS} style={MARK_STYLE}>
          {text.slice(start, safeEnd + 1)}
        </mark>,
      )
    }
    last = end + 1
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

/**
 * Highlights text using Fuse.js match indices for a specific field.
 * Pass the `matches` array from a FuseResult (requires `includeMatches: true`).
 * Falls back to returning plain text when no match data is available.
 */
export function highlightWithMatches(
  text: string,
  matches: ReadonlyArray<FuseResultMatch> | undefined,
  fieldName: string,
): ReactNode {
  if (!matches || matches.length === 0) return text
  const fieldMatch = matches.find(m => m.key === fieldName)
  if (!fieldMatch?.indices?.length) return text
  return buildRanges(text, fieldMatch.indices)
}

// ── Legacy fallback: literal substring highlight ─────────────────────────────
// Used when Fuse match data is not available (e.g. plain string search).
// NOTE: this approach fails for fuzzy / transliteration matches because
// split(literalRegex) won't find «парис» inside «Paris-Brest».
// Prefer highlightWithMatches wherever Fuse results are available.

export function highlightMatch(text: string, query: string): ReactNode {
  if (!query.trim()) return text
  const escaped = query.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <mark key={i} className={MARK_CLASS} style={MARK_STYLE}>
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  )
}
