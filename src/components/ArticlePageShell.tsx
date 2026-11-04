/**
 * ArticlePageShell — React client island rendered on each /articles/<id>/ page.
 */
import { lazy, Suspense, useState, useCallback, useEffect, useRef } from 'react'
import { safeSetItem } from '../utils/storage'
import Header from './Header'
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
    window.scrollTo({ top: 0, behavior: 'auto' })
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
            typeof item.title === 'string',
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
    return () => controller.abort()
  }, [commandOpen, searchMeta, searchFailure, searchAttempt])

  useEffect(() => {
    if (!commandOpen || searchMeta) return
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeCommand()
      }
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [commandOpen, searchMeta, closeCommand])

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
            <Suspense fallback={null}>
              <CommandPalette
                open={commandOpen}
                articles={searchMeta}
                onClose={closeCommand}
                onOpenArticle={openArticleByUrl}
                initialQuery={commandInitialQuery}
              />
            </Suspense>
          ) : (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="article-search-loading-title"
              className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 px-4 pt-[12vh]"
            >
              <div className="w-full max-w-lg rounded-xl border border-stone-700 bg-stone-950 p-6 text-stone-100 shadow-2xl">
                <h2 id="article-search-loading-title" className="text-xl font-semibold">Поиск по библиотеке</h2>
                {searchFailure ? (
                  <div className="mt-4 space-y-3">
                    <p role="alert">Не удалось загрузить каталог поиска. Проверьте соединение.</p>
                    <button
                      type="button"
                      className="rounded-lg border border-stone-500 px-4 py-2"
                      onClick={() => {
                        setSearchFailure(false)
                        setSearchAttempt((attempt) => attempt + 1)
                      }}
                    >
                      Повторить загрузку
                    </button>
                    <a className="block underline" href="/materials/">Открыть галерею материалов</a>
                  </div>
                ) : (
                  <p role="status" className="mt-4 text-stone-300">Загружаем каталог поиска…</p>
                )}
                <button
                  type="button"
                  className="mt-5 rounded-lg border border-stone-600 px-4 py-2"
                  onClick={closeCommand}
                >
                  Закрыть
                </button>
              </div>
            </div>
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
