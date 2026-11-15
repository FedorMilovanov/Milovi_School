/** Split into plain/label/href triples, retaining balanced parentheses in URLs.
 * This is intentionally just the inline-link subset used by the article renderer,
 * not a second Markdown block parser. Malformed markup stays readable text.
 */
export function splitMarkdownLinks(text: string): string[] {
  const parts: string[] = []
  let plainStart = 0
  let cursor = 0
  while (cursor < text.length) {
    if (text[cursor] !== '[' || (cursor > 0 && (text[cursor - 1] === '\\' || text[cursor - 1] === '!'))) {
      cursor++
      continue
    }
    const labelEnd = text.indexOf('](', cursor + 1)
    if (labelEnd < 0) break
    let depth = 1
    let end = labelEnd + 2
    for (; end < text.length; end++) {
      if (text[end] === '\\') { end++; continue }
      if (text[end] === '(') depth++
      if (text[end] === ')' && --depth === 0) break
    }
    if (depth !== 0) { cursor = labelEnd + 2; continue }
    const href = text.slice(labelEnd + 2, end).replace(/\\([()\\])/g, '$1')
    parts.push(text.slice(plainStart, cursor), text.slice(cursor + 1, labelEnd), href)
    cursor = end + 1
    plainStart = cursor
  }
  parts.push(text.slice(plainStart))
  return parts
}

export function safeInlineHref(href: string): string | null {
  // Content is editorial, but don't turn an accidental script/data URL into a link.
  return /^(?:https?:\/\/|mailto:|\/(?!\/)|#)/i.test(href) && !/[\u0000-\u0020]/.test(href) ? href : null
}
