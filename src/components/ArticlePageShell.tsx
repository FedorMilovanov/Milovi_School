/**
 * ArticlePageShell — React client island rendered on each /articles/<id>/ page.
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
import { type Article } from '../data/types'
import type { ArticleClientMeta } from '../data/library'

interface ArticlePageShellProps {
  article: Article
  allMeta: ArticleClientMeta[]
}

export default function ArticlePageShell({ article, allMeta }: ArticlePageShellProps) {
  const [commandOpen, setCommandOpen] = useState(false)

  // FIX B-4: Initialize theme from documentElement (set by inline script)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark'
    if (document.documentElement.classList.contains('dark')) return 'dark'
    if (document.documentElement.classList.contains('light')) return 'light'
    const saved = safeGetItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark'
  })

  useEffect(() => {
    safeSetItem('theme', theme)
    document.documentElement.style.colorScheme = theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), [])

  const goHome = useCallback(() => { window.location.href = '/' }, [])
  const goToSection = useCallback((sectionId: string) => { window.location.href = `/#${sectionId}` }, [])
  const goToArticle = useCallback((a: ArticleClientMeta) => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    window.location.href = `/articles/${a.id}/`
  }, [])
  const goBack = useCallback(() => {
    if (window.history.length > 1 && document.referrer.includes(window.location.hostname)) window.history.back()
    else window.location.href = '/'
  }, [])

  const closeCommand = useCallback(() => setCommandOpen(false), [])
  const openArticleByUrl = useCallback((a: ArticleClientMeta) => {
    window.location.href = `/articles/${a.id}/`
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA') {
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
        <ArticleView
          article={article}
          allArticles={allMeta}
          onBack={goBack}
          onNavigate={goToArticle}
          disableEscapeBack={commandOpen}
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
