/**
 * Signals that the scroll-reveal machinery is alive.
 *
 * `.reveal` elements start at `opacity: 0` under `html.js` (see global.css) and
 * are revealed by an IntersectionObserver inside a hydrated island. The marker
 * alone only proves that the inline pre-paint script ran — not that the bundle
 * that owns the observer ever executed. If the bundle is blocked, fails to parse
 * or throws before mounting, the observer never exists and the sections stay
 * invisible while `html.js` keeps telling CSS they are safe to hide.
 *
 * `BaseLayout` arms a stall timer together with the marker; the first component
 * that actually sets up a reveal observer calls this function to disarm it.
 */
type RevealWindow = Window & { __miloviRevealArm?: () => void }

export function markRevealReady(): void {
  if (typeof window === 'undefined') return
  ;(window as RevealWindow).__miloviRevealArm?.()
}
