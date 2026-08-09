/**
 * Native navigation helper shared by React islands.
 *
 * We intentionally do NOT use Astro ClientRouter here. The site has heavy
 * interactive islands on the home page (custom cursor, search, Framer Motion),
 * and SPA/view-transition navigation to article pages can keep those islands
 * alive while the next page hydrates, causing freezes on slower devices.
 */
type NavigateOptions = { history?: 'auto' | 'push' | 'replace' }

type NetworkInformationLike = {
  saveData?: boolean
  effectiveType?: string
}

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformationLike
}

const prefetchedRoutes = new Set<string>()

/**
 * Warm a same-origin document only after clear user intent (hover/focus).
 * This keeps native full-document navigation while making high-value routes
 * feel immediate. Respect data-saver and very slow connections; never bulk
 * prefetch a whole collection in the background.
 */
export function prefetchRoute(href: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const target = new URL(href, window.location.href)
  if (target.origin !== window.location.origin) return

  const connection = (navigator as NavigatorWithConnection).connection
  if (connection?.saveData || connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') return

  // Hash-only navigation on the current document needs no network warm-up.
  const current = new URL(window.location.href)
  if (target.pathname === current.pathname && target.search === current.search && target.hash) return

  const key = `${target.pathname}${target.search}`
  if (prefetchedRoutes.has(key)) return

  const existing = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="prefetch"]'))
    .some((link) => {
      try {
        const url = new URL(link.href, window.location.href)
        return url.origin === target.origin && `${url.pathname}${url.search}` === key
      } catch {
        return false
      }
    })
  if (existing) {
    prefetchedRoutes.add(key)
    return
  }

  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = target.href
  document.head.appendChild(link)
  prefetchedRoutes.add(key)
}

export async function navigateTo(href: string, options?: NavigateOptions) {
  if (typeof window === 'undefined') return

  const target = new URL(href, window.location.href)
  const current = new URL(window.location.href)

  // Same path + different hash: native hash update/scroll without a full reload.
  if (target.origin === current.origin && target.pathname === current.pathname && target.search === current.search && target.hash) {
    if (options?.history === 'replace') window.location.replace(target.href)
    else window.location.href = target.href
    return
  }

  if (options?.history === 'replace') window.location.replace(target.href)
  else window.location.assign(target.href)
}
