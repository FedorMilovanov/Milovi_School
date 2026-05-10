/**
 * ArticlePageShell — React client island rendered on each /articles/<id>/ page.
 *
 * The article content is baked into the static HTML at build time (SSG),
 * then passed as a prop to this React island for interactive rendering
 * (tooltips, related articles, theme toggle, CommandPalette, etc.)
 *
 * Navigation is purely URL-based:
 *   - Back → history.back() or /
 *   - Related article → /articles/<id>/
 *   - Home sections → /#archive, /#articles, etc.
 */
import { useState, useCallback, useEffect } from 'react'
import { safeGetItem, safeSetItem } from '../utils/storage'
import Header from './Header'
import ArticleView from './ArticleView'
import Footer from './Footer'
import ErrorBoundary from './ErrorBoundary'
import CommandPalette from './CommandPalette'
import UpdateNotification from './UpdateNotification'
import ToastContainer from './Toast'
import ScrollToTop from './ScrollToTop'
import { type Article, type ArticleMeta } from '../data/articles'

interface ArticlePageShellProps {
  /** Full article with content — provided as SSG prop, never fetched by browser */
  article: Article
  /** Lightweight metadata for related articles + command palette search */
  allMeta: ArticleMeta[]
}

export default function ArticlePageShell({ article, allMeta }: ArticlePageShellProps) {
  const [commandOpen, setCommandOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = safeGetItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    safeSetItem('theme', theme)
    document.documentElement.style.colorScheme = theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.body.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), [])

  // Navigation — URL-based (proper browser history, shareable URLs)
  const goHome = useCallback(() => { window.location.href = '/' }, [])
  const goToSection = useCallback((sectionId: string) => { window.location.href = `/#${sectionId}` }, [])
  const goToArticle = useCallback((a: ArticleMeta) => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    window.location.href = `/articles/${a.id}/`
  }, [])
  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/'
    }
  }, [])

  // Stable refs for CommandPalette props — avoids inline function churn.
  const closeCommand = useCallback(() => setCommandOpen(false), [])
  const openArticleByUrl = useCallback((a: ArticleMeta) => {
    window.location.href = `/articles/${a.id}/`
  }, [])

  // Cmd/Ctrl+K → command palette
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        setCommandOpen(true)
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
          onOpenCommand={() => setCommandOpen(true)}
        />
        <ArticleView
          article={article}
          allArticles={allMeta}
          onBack={goBack}
          onNavigate={goToArticle}
        />
        <Footer />
        <CommandPalette
          open={commandOpen}
          articles={allMeta}
          onClose={closeCommand}
          onOpenArticle={openArticleByUrl}
        />
      </ErrorBoundary>
      <UpdateNotification />
      <ToastContainer />
      <ScrollToTop />
    </div>
  )
}
