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

function isValidIndex(value: unknown): value is ArticleClientMeta[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (item: unknown) =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        typeof (item as { id: unknown }).id === 'string' &&
        'title' in item &&
        typeof (item as { title: unknown }).title === 'string',
    )
  )
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
