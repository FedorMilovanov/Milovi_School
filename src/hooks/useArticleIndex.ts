import { useCallback, useEffect, useRef, useState } from 'react'
import type { ArticleClientMeta } from '../data/types'

/**
 * Shared lazy loader for `/article-index.json`.
 *
 * The full article index is ~135 KB of JSON. Shipping it inside an island's
 * props means every visitor of that page pays for it in the HTML document, even
 * though most of them never open search. Instead the index is fetched once, on
 * demand, and cached for the rest of the visit by the browser.
 *
 * The payload is validated before it is handed to the UI: a malformed or
 * truncated response must never reach CommandPalette.
 */
const INDEX_URL = '/article-index.json'

export type ArticleIndexStatus = 'idle' | 'loading' | 'ready' | 'error'

const nonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

/**
 * A record is only usable when the fields the UI actually reads are present.
 * Checking just `id`/`title` accepted a partial payload
 * (`[{"id":"recipe-kouglof","title":"Куглоф"}]`) and handed it to
 * CommandPalette, which rendered a card with an empty category and "· мин"
 * instead of surfacing a recoverable error — a data contract violation that
 * looks like a working search. Every record is validated, and one bad record
 * rejects the whole payload: a half-valid index silently drops articles from
 * search results, which is worse than an explicit retry.
 */
function isArticleRecord(value: unknown): value is ArticleClientMeta {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return (
    nonEmptyString(record.id) &&
    nonEmptyString(record.title) &&
    nonEmptyString(record.category) &&
    typeof record.readTime === 'number' &&
    Number.isFinite(record.readTime) &&
    record.readTime > 0 &&
    nonEmptyString(record.excerpt) &&
    nonEmptyString(record.author) &&
    Array.isArray(record.tags) &&
    record.tags.length > 0 &&
    record.tags.every(nonEmptyString) &&
    nonEmptyString(record.image) &&
    record.image.startsWith('/')
  )
}

function isValidIndex(value: unknown): value is ArticleClientMeta[] {
  return Array.isArray(value) && value.length > 0 && value.every(isArticleRecord)
}

export function useArticleIndex(enabled: boolean) {
  const [index, setIndex] = useState<ArticleClientMeta[] | null>(null)
  const [status, setStatus] = useState<ArticleIndexStatus>('idle')
  const [attempt, setAttempt] = useState(0)
  const inFlight = useRef(false)

  useEffect(() => {
    if (!enabled || index || inFlight.current) return

    const controller = new AbortController()
    inFlight.current = true
    setStatus('loading')

    const load = async () => {
      try {
        const response = await fetch(INDEX_URL, { signal: controller.signal })
        if (!response.ok) throw new Error(`Search index HTTP ${response.status}`)
        const payload: unknown = await response.json()
        if (!isValidIndex(payload)) throw new Error('Invalid article index')
        if (controller.signal.aborted) return
        setIndex(payload)
        setStatus('ready')
      } catch {
        if (!controller.signal.aborted) setStatus('error')
      } finally {
        inFlight.current = false
      }
    }

    void load()
    return () => controller.abort()
  }, [enabled, index, attempt])

  const retry = useCallback(() => {
    setAttempt((value) => value + 1)
  }, [])

  return { index, status, retry }
}
