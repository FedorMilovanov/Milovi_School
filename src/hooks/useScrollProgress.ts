import { useSyncExternalStore } from 'react'

/**
 * FIX C-5/SC-1: True singleton scroll store.
 * A single passive scroll listener is shared across ALL consumers
 * (ScrollProgress, ScrollToTop, ArticleView mobile bar, etc.).
 * Previously each useScrollProgress() call created its own listener.
 */
const scrollStore = {
  subscribe(cb: () => void): () => void {
    window.addEventListener('scroll', cb, { passive: true })
    return () => window.removeEventListener('scroll', cb)
  },
  getSnapshot(): number {
    const el = document.documentElement
    const total = el.scrollHeight - el.clientHeight
    return total > 0 ? Math.min(100, (el.scrollTop / total) * 100) : 0
  },
  getServerSnapshot(): number {
    return 0
  },
}

export function useScrollProgress(): number {
  return useSyncExternalStore(
    scrollStore.subscribe,
    scrollStore.getSnapshot,
    scrollStore.getServerSnapshot,
  )
}
