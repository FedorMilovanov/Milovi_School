/**
 * StaticPageShell — wraps static Astro pages (about.astro, methodology.astro)
 * with the same Header and Footer as the main SPA, so the navigation experience
 * stays consistent across the whole site.
 *
 * FIX #10: static pages were rendered without Header or Footer — users landing
 * on /about/ or /methodology/ had no way to navigate back to the library except
 * the browser back button or the tiny "← На главную" text link.
 *
 * Theme is hardcoded to 'dark' (the site default) because static pages are
 * treated as secondary content; the theme toggle is a no-op here. If a user
 * has selected light mode on the main page, the BaseLayout pre-paint script
 * already applies the correct class to <html> before React hydrates — so the
 * visual theme will still be correct even though the toggle button does nothing.
 */
import { useCallback } from 'react'
import Header from './Header'
import Footer from './Footer'

interface StaticPageShellProps {
  /** The page content. Passed as a JSX snippet. */
  children: React.ReactNode
}

/** Dummy no-op theme — static pages use the site default and don't switch. */
const NOOP_THEME = 'dark' as const

export default function StaticPageShell({ children }: StaticPageShellProps) {
  const goHome = useCallback(() => { window.location.href = '/' }, [])
  const goCategories = useCallback(() => { window.location.href = '/#archive' }, [])
  const goArticles = useCallback(() => { window.location.href = '/#articles' }, [])
  const goAbout = useCallback(() => {
    if (window.location.pathname !== '/about/') window.location.href = '/about/'
  }, [])
  /** Command palette is not available on static pages (SPA feature). */
  const openCommand = useCallback(() => {}, [])

  return (
    <div className="min-h-screen bg-[var(--bg-main)] transition-colors dark:bg-stone-950">
      <Header
        theme={NOOP_THEME}
        onToggleTheme={() => {/* no-op: static pages use site default */}}
        onGoHome={goHome}
        onGoCategories={goCategories}
        onGoArticles={goArticles}
        onGoAbout={goAbout}
        onOpenCommand={openCommand}
      />
      <main id="main-content">{children}</main>
      <Footer />
    </div>
  )
}