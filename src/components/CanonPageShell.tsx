import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Header from './Header'
import Footer from './Footer'
import CanonExperience from './CanonExperience'
import Cursor from './Cursor'
import ScrollProgress from './ScrollProgress'
import ScrollToTop from './ScrollToTop'
import ToastContainer from './Toast'
import UpdateNotification from './UpdateNotification'
import ErrorBoundary from './ErrorBoundary'
import { safeSetItem } from '../utils/storage'
import { navigateTo } from '../utils/navigation'
import type { ArticleClientMeta } from '../data/types'

const CommandPalette = lazy(() => import('./CommandPalette'))

const THEME_LIGHT = '#f5efe5'
const THEME_DARK = '#10100f'

export default function CanonPageShell({ articles }: { articles: ArticleClientMeta[] }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [themeReady, setThemeReady] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const commandOpenRef = useRef(false)

  useEffect(() => { commandOpenRef.current = commandOpen }, [commandOpen])

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA') {
        if (commandOpenRef.current && target?.closest('[role="dialog"]')) return
        event.preventDefault()
        setCommandOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const toggleTheme = useCallback(() => setTheme((value) => value === 'dark' ? 'light' : 'dark'), [])
  const closeCommand = useCallback(() => setCommandOpen(false), [])
  const openArticle = useCallback((article: ArticleClientMeta) => { void navigateTo(`/articles/${article.id}/`) }, [])

  return (
    <div className="min-h-screen bg-[var(--bg-main)] transition-colors dark:bg-stone-950">
      <ErrorBoundary>
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          onGoHome={() => { void navigateTo('/') }}
          onGoCategories={() => { void navigateTo('/#categories') }}
          onGoArticles={() => { void navigateTo('/materials/') }}
          onGoAbout={() => { void navigateTo('/#about') }}
          onOpenCommand={() => setCommandOpen((value) => !value)}
        />

        <CanonExperience />
        <Footer />

        {commandOpen && (
          <Suspense fallback={null}>
            <CommandPalette
              open={commandOpen}
              articles={articles}
              onClose={closeCommand}
              onOpenArticle={openArticle}
              initialQuery=""
            />
          </Suspense>
        )}

        <UpdateNotification />
        <ToastContainer />
        <ScrollProgress />
        <ScrollToTop />
        <Cursor theme={theme} />
      </ErrorBoundary>
    </div>
  )
}
