/**
 * ArticlePageShell — React client island rendered on each /articles/<id>/ page.
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { safeGetItem, safeSetItem } from '../utils/storage'
import Header from './Header'
import ArticleView from './ArticleView'
import Footer from './Footer'
import ErrorBoundary from './ErrorBoundary'
import CommandPalette from './CommandPalette'
import UpdateNotification from './UpdateNotification'
import ToastContainer from './Toast'
import ScrollToTop from './ScrollToTop'
import { type Article } from '../data/types'
import type { ArticleClientMeta } from '../data/types'

interface ArticlePageShellProps {
  article: Article
  allMeta: ArticleClientMeta[]
}

const THEME_LIGHT = '#f5efe5'
const THEME_DARK = '#10100f'

export default function ArticlePageShell({ article, allMeta }: ArticlePageShellProps) {
  const [commandOpen, setCommandOpen] = useState(false)
  const commandOpenRef = useRef(false)
  useEffect(() => { commandOpenRef.current = commandOpen }, [commandOpen])

  // FIX B-4: Initialize theme from documentElement (set by inline script in BaseLayout).
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark'
    if (document.documentElement.classList.contains('dark')) return 'dark'
    const saved = safeGetItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    safeSetItem('theme', theme)
    const root = document.documentElement
    root.style.colorScheme = theme
    root.classList.toggle('dark', theme === 'dark')
    // Keep the single <meta name="theme-color"> in sync so Android Chrome
    // updates its system bar immediately when the user toggles theme.
    const meta = document.getElementById('theme-color-meta')
    if (meta) meta.setAttribute('content', theme === 'dark' ? THEME_DARK : THEME_LIGHT)
  }, [theme])

  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), [])

  const goHome = useCallback(() => { window.location.href = '/' }, [])
  const goToSection = useCallback((sectionId: string) => { window.location.href = `/#${sectionId}` }, [])
  const goToArticle = useCallback((a: ArticleClientMeta) => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    window.location.href = `/articles/${a.id}/`
  }, [])

  /**
   * goBack — return to the previous page or fall back to the library.
   *
   * Previous implementation relied on `document.referrer.includes(hostname)`
   * which is empty when the user navigates via window.location.href on the
   * same origin (browser doesn't always set the Referer header for SPA-style
   * jumps). Result: pressing "Back" on a deep-linked article would silently
   * land you on the home page instead of the previous article.
   *
   * New strategy: tag our own history entries with a state token. If the
   * current entry carries our token AND we have somewhere to go back to,
   * pop history. Otherwise navigate to the home page deterministically.
   */
  const goBack = useCallback(() => {
    const state = window.history.state
    const isOurs = state && typeof state === 'object' && 'miloviInternal' in state
    if (isOurs && window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/'
    }
  }, [])

  // Tag the current history entry exactly once so future goBack() calls
  // can distinguish "navigated here from elsewhere on the site" vs.
  // "landed here cold from an external link".
  useEffect(() => {
    const state = window.history.state
    if (!state || typeof state !== 'object' || !('miloviInternal' in state)) {
      window.history.replaceState({ ...(state ?? {}), miloviInternal: true }, '')
    }
  }, [])

  const closeCommand = useCallback(() => setCommandOpen(false), [])
  const openArticleByUrl = useCallback((a: ArticleClientMeta) => {
    window.location.href = `/articles/${a.id}/`
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA') {
        if (commandOpenRef.current && target?.closest('[role="dialog"]')) return
        e.preventDefault()
        setCommandOpen(v => !v)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg-main)] transition-colors dark:bg-stone-950">
      <ErrorBoundary>
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          onGoHome={goHome}
          onGoCategories={() => goToSection('archive')}
          onGoArticles={() => goToSection('articles')}
          onGoAbout={() => goToSection('about')}
          onOpenCommand={() => setCommandOpen(v => !v)}
        />
        {/*
          id="main-content" is the target of the global skip-to-content link
          rendered in BaseLayout.astro. Lets keyboard / screen-reader users
          jump past the sticky header straight to the article body.
        */}
        <div id="main-content">
          <ArticleView
            article={article}
            allArticles={allMeta}
            onBack={goBack}
            onNavigate={goToArticle}
            disableEscapeBack={commandOpen}
          />
        </div>
        <Footer />
        <CommandPalette
          open={commandOpen}
          articles={allMeta}
          onClose={closeCommand}
          onOpenArticle={openArticleByUrl}
        />
      </ErrorBoundary>
      <UpdateNotification />
      <ToastContainer className="max-lg:bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6" />
      <ScrollToTop />
    </div>
  )
}
