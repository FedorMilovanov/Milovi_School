/**
 * ArticlePageShell — React client island rendered on each /articles/<id>/ page.
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { safeSetItem } from '../utils/storage'
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
import { navigateTo } from '../utils/navigation'

interface ArticlePageShellProps {
  article: Article
  allMeta: ArticleClientMeta[]
}

const THEME_LIGHT = '#f5efe5'
const THEME_DARK = '#10100f'

export default function ArticlePageShell({ article, allMeta }: ArticlePageShellProps) {
  const [commandOpen, setCommandOpen] = useState(false)
  const [commandInitialQuery, setCommandInitialQuery] = useState('')
  const commandOpenRef = useRef(false)
  useEffect(() => { commandOpenRef.current = commandOpen }, [commandOpen])

  // Hydration-safe theme state: SSR and the first client render both use
  // "dark" to match the static HTML. The pre-paint script in BaseLayout has
  // already applied the real visual theme to <html>, so this only synchronises
  // React controls after mount without causing hydration mismatches.
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
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
    // Keep the single <meta name="theme-color"> in sync so Android Chrome
    // updates its system bar immediately when the user toggles theme.
    const meta = document.getElementById('theme-color-meta')
    if (meta) meta.setAttribute('content', theme === 'dark' ? THEME_DARK : THEME_LIGHT)
  }, [theme, themeReady])

  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), [])

  const goHome = useCallback(() => { void navigateTo('/') }, [])
  const goToSection = useCallback((sectionId: string) => { void navigateTo(`/#${sectionId}`) }, [])
  const goToArticle = useCallback((a: ArticleClientMeta) => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    void navigateTo(`/articles/${a.id}/`)
  }, [])

  /**
   * Safe back navigation.
   *
   * The previous version marked the current history entry as "internal" on
   * mount and then blindly called history.back(). On a direct visit from Google,
   * Telegram, etc. that sent users away from the site. Only go back when the
   * browser referrer is same-origin; otherwise return to the library home.
   */
  const canUseBrowserBackRef = useRef(false)
  useEffect(() => {
    try {
      const referrer = document.referrer ? new URL(document.referrer) : null
      canUseBrowserBackRef.current = Boolean(
        referrer &&
        referrer.origin === window.location.origin &&
        referrer.href !== window.location.href,
      )
    } catch {
      canUseBrowserBackRef.current = false
    }
  }, [])

  const goBack = useCallback(() => {
    if (canUseBrowserBackRef.current) {
      history.back()
    } else {
      void navigateTo('/')
    }
  }, [])

  const closeCommand = useCallback(() => setCommandOpen(false), [])
  const openArticleByUrl = useCallback((a: ArticleClientMeta) => {
    void navigateTo(`/articles/${a.id}/`)
  }, [])

  const openTagSearch = useCallback((tag: string) => {
    setCommandInitialQuery(tag)
    setCommandOpen(true)
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
        <main id="main-content">
          <ArticleView
            article={article}
            allArticles={allMeta}
            onBack={goBack}
            onNavigate={goToArticle}
            disableEscapeBack={commandOpen}
            onTagSearch={openTagSearch}
          />
        </main>
        <Footer />
        <CommandPalette
          open={commandOpen}
          articles={allMeta}
          onClose={closeCommand}
          onOpenArticle={openArticleByUrl}
          initialQuery={commandInitialQuery}
        />
        <UpdateNotification />
        <ToastContainer className="max-lg:bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6" />
        <ScrollToTop />
      </ErrorBoundary>
    </div>
  )
}
