/**
 * ArticlePageShell — React client island rendered on each /articles/<id>/ page.
 */
import { lazy, Suspense, useState, useCallback, useEffect, useRef } from 'react'
import { safeSetItem } from '../utils/storage'
import Header from './Header'
import SearchStatusDialog from './SearchStatusDialog'
import ArticleView from './ArticleView'
import CanonArticleNav from './CanonArticleNav'
import Footer from './Footer'
import ErrorBoundary from './ErrorBoundary'
import UpdateNotification from './UpdateNotification'
import ToastContainer from './Toast'
import ScrollToTop from './ScrollToTop'
import ScrollProgress from './ScrollProgress'
import Cursor from './Cursor'
import { type Article } from '../data/types'
import type { ArticleClientMeta } from '../data/types'
import { navigateTo } from '../utils/navigation'

interface ArticlePageShellProps {
  article: Article
  relatedMeta: ArticleClientMeta[]
}

const CommandPalette = lazy(() => import('./CommandPalette'))

const THEME_LIGHT = '#f5efe5'
const THEME_DARK = '#10100f'

export default function ArticlePageShell({ article, relatedMeta }: ArticlePageShellProps) {
  const [commandOpen, setCommandOpen] = useState(false)
  const [commandInitialQuery, setCommandInitialQuery] = useState('')
  const [searchMeta, setSearchMeta] = useState<ArticleClientMeta[] | null>(null)
  const [searchFailure, setSearchFailure] = useState(false)
  const [searchAttempt, setSearchAttempt] = useState(0)
  const commandOpenRef = useRef(false)
  useEffect(() => { commandOpenRef.current = commandOpen }, [commandOpen])

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
    const meta = document.getElementById('theme-color-meta')
    if (meta) meta.setAttribute('content', theme === 'dark' ? THEME_DARK : THEME_LIGHT)
  }, [theme, themeReady])

  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), [])

  const goHome = useCallback(() => { void navigateTo('/') }, [])
  const goToSection = useCallback((sectionId: string) => { void navigateTo(`/#${sectionId}`) }, [])
  const goToArticle = useCallback((a: ArticleClientMeta) => {
    void navigateTo(`/articles/${a.id}/`)
  }, [])

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

  const closeCommand = useCallback(() => {
    setCommandOpen(false)
    setCommandInitialQuery('')
  }, [])
  const openArticleByUrl = useCallback((a: ArticleClientMeta) => {
    void navigateTo(`/articles/${a.id}/`)
  }, [])

  const openTagSearch = useCallback((tag: string) => {
    setCommandInitialQuery(tag)
    setCommandOpen(true)
  }, [])

  // Fetch the shared search index only when someone opens search, rather than
  // serializing all article metadata into every individual article page.
  useEffect(() => {
    if (!commandOpen || searchMeta || searchFailure) return

    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      setSearchFailure(true)
      controller.abort()
    }, 15000)
    const loadSearch = async () => {
      try {
        const response = await fetch('/article-index.json', { signal: controller.signal })
        if (!response.ok) throw new Error(`Search index HTTP ${response.status}`)
        const payload: unknown = await response.json()
        if (
          !Array.isArray(payload) ||
          payload.length === 0 ||
          !payload.every((item: unknown) =>
            typeof item === 'object' &&
            item !== null &&
            'id' in item &&
            typeof item.id === 'string' &&
            'title' in item &&
            typeof item.title === 'string' &&
            'category' in item && typeof item.category === 'string' &&
            'tags' in item && Array.isArray(item.tags) && item.tags.every((tag: unknown) => typeof tag === 'string') &&
            'readTime' in item && typeof item.readTime === 'number' &&
            'excerpt' in item && typeof item.excerpt === 'string' &&
            'author' in item && typeof item.author === 'string',
          )
        ) {
          throw new Error('Invalid article index')
        }
        if (!controller.signal.aborted) setSearchMeta(payload as ArticleClientMeta[])
      } catch {
        if (!controller.signal.aborted) setSearchFailure(true)
      }
    }

    void loadSearch()
    return () => { window.clearTimeout(timeout); controller.abort() }
  }, [commandOpen, searchMeta, searchFailure, searchAttempt])

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
          onGoArticles={() => { void navigateTo('/materials/') }}
          onGoAbout={() => goToSection('about')}
          onOpenCommand={() => setCommandOpen(v => !v)}
        />
        <main id="main-content">
          <CanonArticleNav articleId={article.id} placement="top" />
          <ArticleView
            article={article}
            allArticles={relatedMeta}
            onBack={goBack}
            onNavigate={goToArticle}
            disableEscapeBack={commandOpen}
            onTagSearch={openTagSearch}
          />
          <CanonArticleNav articleId={article.id} placement="bottom" />
        </main>
        <Footer />
        {commandOpen && (
          searchMeta ? (
            <ErrorBoundary fallback={<SearchStatusDialog failed onClose={closeCommand} onRetry={() => window.location.reload()} />}>
            <Suspense fallback={<SearchStatusDialog onClose={closeCommand} />}>
              <CommandPalette
                open={commandOpen}
                articles={searchMeta}
                onClose={closeCommand}
                onOpenArticle={openArticleByUrl}
                initialQuery={commandInitialQuery}
              />
            </Suspense>
            </ErrorBoundary>
          ) : (
            <SearchStatusDialog
              failed={searchFailure}
              onClose={closeCommand}
              onRetry={() => {
                setSearchFailure(false)
                setSearchAttempt(attempt => attempt + 1)
              }}
            />
          )
        )}
        <UpdateNotification />
        <ToastContainer className="max-lg:bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6" />
        <ScrollToTop />
        <ScrollProgress />
        <Cursor theme={theme} />
      </ErrorBoundary>
    </div>
  )
}
