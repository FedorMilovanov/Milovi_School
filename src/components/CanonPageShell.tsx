import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Header from './Header'
import Footer from './Footer'
import CanonExperience, { type CanonDossier } from './CanonExperience'
import Cursor from './Cursor'
import ScrollProgress from './ScrollProgress'
import ScrollToTop from './ScrollToTop'
import ToastContainer from './Toast'
import UpdateNotification from './UpdateNotification'
import ErrorBoundary from './ErrorBoundary'
import SearchStatusDialog from './SearchStatusDialog'
import { safeSetItem } from '../utils/storage'
import { navigateTo } from '../utils/navigation'
import { useArticleIndex } from '../hooks/useArticleIndex'
import type { ArticleClientMeta } from '../data/types'

const CommandPalette = lazy(() => import('./CommandPalette'))

const THEME_LIGHT = '#f5efe5'
const THEME_DARK = '#10100f'

export default function CanonPageShell({ dossiers }: { dossiers: Record<string, CanonDossier> }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [themeReady, setThemeReady] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const commandOpenRef = useRef(false)
  // Search metadata is fetched on first open instead of being serialized into
  // the page: /canon/ used to carry ~144 KB of unused article props.
  const { index: searchIndex, status: searchStatus, retry: retrySearch } = useArticleIndex(commandOpen)

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

        <CanonExperience dossiers={dossiers} />
        <Footer />

        {commandOpen && (
          searchIndex ? (
            <ErrorBoundary fallback={
              <SearchStatusDialog
                titleId="canon-search-loading-title"
                failed
                onClose={closeCommand}
                onRetry={() => window.location.reload()}
              />
            }>
              <Suspense fallback={<SearchStatusDialog titleId="canon-search-loading-title" onClose={closeCommand} />}>
                <CommandPalette
                  open={commandOpen}
                  articles={searchIndex}
                  onClose={closeCommand}
                  onOpenArticle={openArticle}
                  initialQuery=""
                />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <SearchStatusDialog
              titleId="canon-search-loading-title"
              failed={searchStatus === "error"}
              onClose={closeCommand}
              onRetry={retrySearch}
            />
          )
        )
        <UpdateNotification />
        <ToastContainer />
        <ScrollProgress />
        <ScrollToTop />
        <Cursor theme={theme} />
      </ErrorBoundary>
    </div>
  )
}
