/**
 * HomeApp — React client island for the home page.
 */
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import Fuse, { type FuseResultMatch } from 'fuse.js'
import { safeSetItem } from '../utils/storage'
import Header from './Header'
import Hero from './Hero'
import ShowcaseSlider from './ShowcaseSlider'
import StatsBar from './StatsBar'
import DashboardBento from './DashboardBento'
import MainCategories from './MainCategories'
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
import { useChromeVisible } from '../hooks/useScrollDirection'
import { type ArticleClientMeta } from '../data/types'
import { categories, NON_CHEF_CATEGORY_IDS } from '../data/categories'
import { ARTICLE_FUSE_OPTIONS } from '../utils/search'

const CHEF_IDS = new Set(
  categories.filter(c => !NON_CHEF_CATEGORY_IDS.has(c.id)).map(c => c.id),
)

const NON_CHEF_NON_TECH_IDS = ['chiffres-gourmands', 'french-cuisine', 'histoire-culinaire']

const THEME_LIGHT = '#f5efe5'
const THEME_DARK = '#10100f'

interface HomeAppProps {
  articles: ArticleClientMeta[]
}

export default function HomeApp({ articles }: HomeAppProps) {
  const nonEmptyCategories = useMemo(() => {
    const articleCategoryIds = new Set(articles.map(a => a.category))
    return categories.filter(c => articleCategoryIds.has(c.id))
  }, [articles])

  const statsArticleCount = articles.length
  const statsAuthorCount = useMemo(() => {
    const articleCats = new Set(articles.map(a => a.category))
    return categories.filter(c => CHEF_IDS.has(c.id) && articleCats.has(c.id)).length
  }, [articles])
  const statsCategoryCount = useMemo(() => {
    const articleCats = new Set(articles.map(a => a.category))
    return categories.filter(c => articleCats.has(c.id)).length
  }, [articles])

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // FIX B-5: Safe hydration — start with empty string, then read URL in useEffect.
  const [searchQuery, setSearchQuery] = useState('')
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('q') ?? ''
    if (initial) setSearchQuery(initial)
  }, [])

  const [commandOpen, setCommandOpen] = useState(false)
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

  // FIX P-2: bottom bar visibility now reads from the shared chrome-visibility
  // store (single passive scroll listener, rAF-throttled). Previously HomeApp
  // attached its OWN scroll listener in addition to useScrollProgress'.
  const barVisible = useChromeVisible()

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

  const syncUrlQuery = useCallback((query: string) => {
    const params = new URLSearchParams(window.location.search)
    if (query.trim()) params.set('q', query)
    else params.delete('q')
    const qs = params.toString()
    window.history.replaceState({}, '', qs ? `?${qs}` : window.location.pathname)
  }, [])

  // FIX C-3: tag buttons in ArticleView write a pending-search to sessionStorage
  // instead of doing a full page reload. Pick it up here and apply to search state.
  useEffect(() => {
    const pending = sessionStorage.getItem('pending-search')
    if (pending) {
      sessionStorage.removeItem('pending-search')
      setSearchQuery(pending)
      syncUrlQuery(pending)
    }
  }, [syncUrlQuery])

  const handleSelectCategory = useCallback((id: string | null) => {
    setSelectedCategory(id)
    setSearchQuery('')
    syncUrlQuery('')
  }, [syncUrlQuery])

  const fuse = useMemo(() => new Fuse(articles, ARTICLE_FUSE_OPTIONS), [articles])

  const { filteredArticles, matchMap } = useMemo(() => {
    const byCategory = selectedCategory
      ? selectedCategory === 'chefs'
        ? articles.filter(a => CHEF_IDS.has(a.category))
        : articles.filter(a => a.category === selectedCategory)
      : articles

    if (!searchQuery.trim()) {
      return { filteredArticles: byCategory, matchMap: new Map() }
    }

    const results = fuse.search(searchQuery.trim())
    const map = new Map(results.map(r => [r.item.id, r.matches ?? []]))

    const filtered = selectedCategory
      ? selectedCategory === 'chefs'
        ? results.filter(r => CHEF_IDS.has(r.item.category)).map(r => r.item)
        : results.filter(r => r.item.category === selectedCategory).map(r => r.item)
      : results.map(r => r.item)

    return { filteredArticles: filtered, matchMap: map }
  }, [articles, selectedCategory, searchQuery, fuse])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    syncUrlQuery(query)
  }, [syncUrlQuery])

  const goHome = useCallback(() => {
    setSelectedCategory(null)
    setSearchQuery('')
    syncUrlQuery('')
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0)
  }, [syncUrlQuery])

  const scrollToSection = useCallback((id: string) => {
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }, [])

  const goToChefs = useCallback(() => {
    setSelectedCategory(null)
    setSearchQuery('')
    scrollToSection('archive')
  }, [scrollToSection])

  const openArticle = useCallback((article: ArticleClientMeta) => {
    window.location.href = `/articles/${article.id}/`
  }, [])

  const closeCommand = useCallback(() => setCommandOpen(false), [])
  const handleCommandSelectCategory = useCallback((id: string) => {
    handleSelectCategory(id)
    scrollToSection('archive')
    setCommandOpen(false)
  }, [handleSelectCategory, scrollToSection])

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

  const activeSection: 'home' | 'archive' | 'articles' = !selectedCategory
    ? 'home'
    : (CHEF_IDS.has(selectedCategory) || NON_CHEF_NON_TECH_IDS.includes(selectedCategory) ? 'archive' : 'articles')

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
          onOpenCommand={() => setCommandOpen(v => !v)}
        />
        {/*
          id="main-content" is the target of the global skip-to-content link
          rendered in BaseLayout.astro. <main> is the correct landmark.
        */}
        <main id="main-content">
          <Hero
            totalArticles={articles.length}
            onSelectCategory={(id) => { handleSelectCategory(id); scrollToSection('archive') }}
          />
          <ShowcaseSlider onItemClick={(cat) => { handleSelectCategory(cat); scrollToSection('archive') }} />
          <StatsBar
            articleCount={statsArticleCount}
            authorCount={statsAuthorCount}
            categoryCount={statsCategoryCount}
            onGoToArticles={() => scrollToSection('articles')}
          />
          <MainCategories
            articles={articles}
            onSelectCategory={(id) => { handleSelectCategory(id); scrollToSection('archive') }}
          />
          <ContinueReading articles={articles} onArticleClick={openArticle} />
          <DashboardBento articles={articles} onArticleClick={openArticle} />
          <Categories
            categories={nonEmptyCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
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
            matchMap={matchMap as Map<string, ReadonlyArray<FuseResultMatch>>}
          />
        </main>
        <Footer />
        <CommandPalette
          open={commandOpen}
          articles={articles}
          onClose={closeCommand}
          onOpenArticle={openArticle}
          onSelectCategory={handleCommandSelectCategory}
        />
        <MobileBottomBar
          onGoHome={goHome}
          onGoCategories={goToChefs}
          onGoArticles={() => scrollToSection('articles')}
          onOpenCommand={() => setCommandOpen(v => !v)}
          visible={barVisible}
          activeSection={activeSection}
        />
        <UpdateNotification />
        <ToastContainer />
        <ScrollProgress />
        <ScrollToTop />
      </ErrorBoundary>
    </div>
  )
}
