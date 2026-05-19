/**
 * Native navigation helper shared by React islands.
 *
 * We intentionally do NOT use Astro ClientRouter here. The site has heavy
 * interactive islands on the home page (custom cursor, search, Framer Motion),
 * and SPA/view-transition navigation to article pages can keep those islands
 * alive while the next page hydrates, causing freezes on slower devices.
 */
type NavigateOptions = { history?: 'auto' | 'push' | 'replace' }

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
