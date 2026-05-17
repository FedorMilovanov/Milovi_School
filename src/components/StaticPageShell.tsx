/**
 * StaticPageShell wraps static Astro pages with the same Header and Footer as
 * the main React app. The page body remains Astro-rendered; the shell hydrates
 * only the shared navigation/footer island.
 */
import { useCallback, useEffect, useState } from 'react'
import Footer from './Footer'
import Header from './Header'
import { safeSetItem } from '../utils/storage'

type Theme = 'light' | 'dark'

const THEME_DARK = '#10100f'
const THEME_LIGHT = '#fafaf9'

interface StaticPageShellProps {
  children: React.ReactNode
}

export default function StaticPageShell({ children }: StaticPageShellProps) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [themeReady, setThemeReady] = useState(false)

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    setThemeReady(true)
  }, [])

  useEffect(() => {
    if (!themeReady) return
    safeSetItem('theme', theme)
    const root = document.documentElement
    root.style.colorScheme = theme
    root.classList.toggle('dark', theme === 'dark')
    const meta = document.getElementById('theme-color-meta')
    if (meta) meta.setAttribute('content', theme === 'dark' ? THEME_DARK : THEME_LIGHT)
  }, [theme, themeReady])

  const goHome = useCallback(() => {
    window.location.href = '/'
  }, [])

  const goCategories = useCallback(() => {
    window.location.href = '/#archive'
  }, [])

  const goArticles = useCallback(() => {
    window.location.href = '/#articles'
  }, [])

  const goAbout = useCallback(() => {
    window.location.href = '/about/'
  }, [])

  // Command palette is a HomeApp feature; on static pages the safest action is
  // to return to the SPA and let users search from there.
  const openCommand = useCallback(() => {
    window.location.href = '/?command=1'
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors dark:bg-stone-950">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
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
