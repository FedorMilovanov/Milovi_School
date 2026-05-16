import { useSyncExternalStore } from 'react'

type Listener = () => void

const listeners = new Set<Listener>()
let frame: number | null = null
let listening = false

function emit() {
  frame = null
  listeners.forEach((listener) => listener())
}

function onScrollOrResize() {
  if (frame !== null) return
  frame = window.requestAnimationFrame(emit)
}

function startListening() {
  if (listening || typeof window === 'undefined') return
  listening = true
  window.addEventListener('scroll', onScrollOrResize, { passive: true })
  window.addEventListener('resize', onScrollOrResize, { passive: true })
}

function stopListening() {
  if (!listening || listeners.size > 0 || typeof window === 'undefined') return
  listening = false
  window.removeEventListener('scroll', onScrollOrResize)
  window.removeEventListener('resize', onScrollOrResize)
  if (frame !== null) {
    window.cancelAnimationFrame(frame)
    frame = null
  }
}

/**
 * True singleton scroll-progress store.
 *
 * All consumers share one passive scroll listener and one resize listener.
 * useSyncExternalStore still subscribes per component, but subscriptions are
 * fan-out callbacks inside this module instead of independent DOM listeners.
 */
const scrollStore = {
  subscribe(cb: Listener): () => void {
    listeners.add(cb)
    startListening()
    return () => {
      listeners.delete(cb)
      stopListening()
    }
  },
  getSnapshot(): number {
    if (typeof document === 'undefined') return 0
    const el = document.documentElement
    const total = el.scrollHeight - el.clientHeight
    return total > 0 ? Math.min(100, Math.max(0, (el.scrollTop / total) * 100)) : 0
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
