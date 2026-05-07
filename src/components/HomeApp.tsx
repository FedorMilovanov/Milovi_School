/**
 * HomeApp — React client island for the home page.
 *
 * Receives pre-rendered article metadata (no content) from the Astro page.
 * When a user clicks an article, we navigate to /articles/<id>/ via browser URL —
 * the full article content is served as a static HTML page (SSG).
 *
 * This means deepContents.ts (951 KB) is NEVER shipped to the browser.
 * Each article page only embeds its own content.
 */
import { useState, useCallback, useEffect } from 'react'
import { safeGetItem, safeSetItem } from '../utils/storage'
import Header from './Header'
import Hero from './Hero'
import ShowcaseSlider from './ShowcaseSlider'
import StatsBar from './StatsBar'
import DashboardBento from './DashboardBento'

import Categories from './Categories'
import ArticlesGrid from './ArticlesGrid'
import Footer from './Footer'
import ErrorBoundary from './ErrorBoundary'
import CommandPalette from './CommandPalette'
import ContinueReading from './ContinueReading'
import MobileBottomBar from './MobileBottomBar'
import UpdateNotification from './UpdateNotification'
import ToastContainer from './Toast'
import ScrollProgress from './ScrollProgress'
import ScrollToTop from './ScrollToTop'
import { type ArticleMeta } from '../data/articles'
import { categories } from '../data/categories'

// Defined outside component — constant, never changes across renders
const CHEF_IDS = new Set([
  'pierre-herme', 'cedric-grolet', 'christophe-michalak', 'philippe-conticini',
  'nina-metayer', 'yann-couvreur', 'dominique-ansel', 'claire-heitzler',
  'francois-perret', 'cyril-lignac', 'nicolas-paciello', 'christophe-felder',
  'mercotte', 'jacques-genin',
])

interface HomeAppProps {
  /** All articles metadata (no content) — safe to embed in page HTML */
  articles: ArticleMeta[]
}

export default function HomeApp({ articles }: HomeAppProps) {
  const articleCategoryIds = new Set(articles.map(a => a.category))
  const nonEmptyCategories = categories.filter(c => articleCategoryIds.has(c.id))

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('q') ?? ''
  })
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

  // Reset search when changing category — prevents "nothing found" on combined filter
  const handleSelectCategory = useCallback((id: string | null) => {
    setSelectedCategory(id)
    setSearchQuery('')
  }, [])

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory ? article.category === selectedCategory : true
    const haystack = [article.title, article.excerpt, article.author, ...(article.tags ?? [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    const matchesSearch = searchQuery ? haystack.includes(searchQuery.toLowerCase()) : true
    return matchesCategory && matchesSearch
  })

  // Navigation helpers — smooth scroll on home page
  const goHome = useCallback(() => {
    setSelectedCategory(null)
    setSearchQuery('')
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0)
  }, [])

  const scrollToSection = useCallback((id: string) => {
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }, [])

  // Theme navigation for bottom bar
  const goToChefs = useCallback(() => {
    setSelectedCategory(null)
    setSearchQuery('')
    scrollToSection('archive')
  }, [scrollToSection])

  // Article click → navigate to static article page
  const openArticle = useCallback((article: ArticleMeta) => {
    window.location.href = `/articles/${article.id}/`
  }, [])

  // Keyboard shortcut Cmd/Ctrl+K → command palette
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
          onGoCategories={() => scrollToSection('archive')}
          onGoArticles={() => scrollToSection('articles')}
          onGoAbout={() => scrollToSection('about')}
          onOpenCommand={() => setCommandOpen(true)}
        />
        <Hero totalArticles={articles.length} />
        <ShowcaseSlider onItemClick={(cat) => { handleSelectCategory(cat); scrollToSection('archive') }} />
        <StatsBar />
        <ContinueReading articles={articles} onArticleClick={openArticle} />
        <DashboardBento articles={articles} onArticleClick={openArticle} />
        <Categories
          categories={nonEmptyCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          allArticles={articles}
        />
        <ArticlesGrid
          articles={filteredArticles}
          allArticles={articles}
          categories={nonEmptyCategories}
          onArticleClick={openArticle}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          searchQuery={searchQuery}
        />
        <Footer />
        <CommandPalette
          open={commandOpen}
          articles={articles}
          theme={theme}
          onClose={() => setCommandOpen(false)}
          onOpenArticle={openArticle}
          onGoHome={goHome}
          onGoCategories={() => scrollToSection('archive')}
          onGoArticles={() => scrollToSection('articles')}
          onToggleTheme={toggleTheme}
        />
        <MobileBottomBar
          onGoHome={goHome}
          onGoCategories={goToChefs}
          onGoArticles={() => scrollToSection('articles')}
          onOpenCommand={() => setCommandOpen(true)}
          activeSection={
            selectedCategory === 'techniques' ? 'articles'
            : selectedCategory === 'recipes' ? 'articles'
            : selectedCategory && CHEF_IDS.has(selectedCategory) ? 'archive'
            : 'home'
          }
        />
      </ErrorBoundary>
      <UpdateNotification />
      <ToastContainer />
      <ScrollProgress />
      <ScrollToTop />
    </div>
  )
}
