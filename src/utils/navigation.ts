/**
 * Small navigation helper shared by React islands.
 *
 * When Astro's ClientRouter is available, programmatic navigation uses the
 * same view-transition client router as normal <a> clicks. If the router module
 * is unavailable for any reason (older Astro, disabled JS, test environment),
 * we fall back to the browser's native navigation.
 */
type NavigateOptions = { history?: 'auto' | 'push' | 'replace' }
type AstroNavigate = (href: string, options?: NavigateOptions) => void | Promise<void>

export async function navigateTo(href: string, options?: NavigateOptions) {
  try {
    const mod = (await import('astro:transitions/client')) as { navigate?: AstroNavigate }
    if (typeof mod.navigate === 'function') {
      await mod.navigate(href, options)
      return
    }
  } catch {
    // Fall through to native navigation.
  }

  if (options?.history === 'replace') window.location.replace(href)
  else window.location.assign(href)
}
