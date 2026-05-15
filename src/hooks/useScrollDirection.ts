import { useSyncExternalStore } from 'react'

/**
 * useChromeVisible — shared store that tells UI chrome (mobile bottom bar,
 * floating action buttons, etc.) whether it should be visible based on
 * scroll direction.
 *
 * Why a shared store?  Each independent useEffect(scroll-listener) pattern
 * adds another invocation per scroll frame. With multiple chrome elements
 * (HomeApp had its own listener AND useScrollProgress had another) we were
 * triggering N listeners per frame and re-rendering N components.  This
 * store registers ONE passive listener while there is at least one
 * subscriber, throttles via requestAnimationFrame, and pushes only when
 * the boolean visibility actually flips.
 *
 * Returns true when the chrome should be visible (scrolling up OR within
 * the first HIDE_THRESHOLD pixels of the page); false when scrolling down
 * past that.
 */
const HIDE_THRESHOLD = 100
const DELTA_NOISE = 6

let lastY = typeof window === 'undefined' ? 0 : window.scrollY
let visible = true
let frame = 0
const listeners = new Set<() => void>()

function recompute() {
  frame = 0
  const current = window.scrollY
  const delta = current - lastY
  if (Math.abs(delta) < DELTA_NOISE) return
  const next = delta < 0 || current < HIDE_THRESHOLD
  lastY = current
  if (next === visible) return
  visible = next
  listeners.forEach((fn) => fn())
}

function onScroll() {
  if (frame) return
  frame = requestAnimationFrame(recompute)
}

const store = {
  subscribe(cb: () => void): () => void {
    if (listeners.size === 0) {
      // First subscriber: prime baseline + attach listener
      lastY = window.scrollY
      visible = true
      window.addEventListener('scroll', onScroll, { passive: true })
    }
    listeners.add(cb)
    return () => {
      listeners.delete(cb)
      if (listeners.size === 0) {
        window.removeEventListener('scroll', onScroll)
        if (frame) {
          cancelAnimationFrame(frame)
          frame = 0
        }
      }
    }
  },
  getSnapshot(): boolean { return visible },
  getServerSnapshot(): boolean { return true },
}

export function useChromeVisible(): boolean {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
}
