/**
 * HomeApp — React client island for the home page.
 */
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import Fuse, { type FuseResultMatch } from 'fuse.js'
import { safeGetItem, safeSetItem } from '../utils/storage'
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
import { type ArticleMeta } from '../data/types'
import { categories, NON_CHEF_CATEGORY_IDS } from '../data/categories'

const CHEF_IDS = new Set(
  categories.filter(c => !NON_CHEF_CATEGORY_IDS.has(c.id)).map(c => c.id),
)

interface HomeAppProps {
  articles: ArticleMeta[]
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
  
  // FIX B-5: Safe hydration — start with empty string, then read URL in useEffect
  const [searchQuery, setSearchQuery] = useState('')
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('q') ?? ''
    if (initial) setSearchQuery(initial)
  }, [])

  const [commandOpen, setCommandOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark'
    const saved = safeGetItem('theme')
    if (saved === 'light') return 'light'
    return 'dark'
  })

  const [barVisible, setBarVisible] = useState(true)
  const lastScrollY = useRef(0)
  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY
      const delta = current - lastScrollY.current
      if (Math.abs(delta) < 6) return
      setBarVisible(delta < 0 || current < 100)
      lastScrollY.current = current
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    safeSetItem('theme', theme)
    document.documentElement.style.colorScheme = theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), [])

  const syncUrlQuery = useCallback((query: string) => {
    const params = new URLSearchParams(window.location.search)
    if (query.trim()) params.set('q', query)
    else params.delete('q')
    const qs = params.toString()
    window.history.replaceState({}, '', qs ? `?${qs}` : window.location.pathname)
  }, [])

  const handleSelectCategory = useCallback((id: string | null) => {
    setSelectedCategory(id)
    setSearchQuery('')
    syncUrlQuery('')
  }, [syncUrlQuery])

  const fuse = useMemo(() => new Fuse(articles, {
    keys: [
      { name: 'title',   weight: 0.45 },
      { name: 'excerpt', weight: 0.2  },
      { name: 'author',  weight: 0.15 },
      { name: 'tags',    weight: 0.15 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeMatches: true,
  }), [articles])

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

  const openArticle = useCallback((article: ArticleMeta) => {
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
          onGoCategories={() => scrollToSection('archive')}
          onGoArticles={() => scrollToSection('articles')}
          onGoAbout={() => scrollToSection('about')}
          onOpenCommand={() => setCommandOpen(v => !v)}
        />
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
          activeSection={
            !selectedCategory ? 'home' : (CHEF_IDS.has(selectedCategory) || ['chiffres-gourmands', 'french-cuisine', 'histoire-culinaire'].includes(selectedCategory) ? 'archive' : 'articles')
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
