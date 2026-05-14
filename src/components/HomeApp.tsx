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

// F-13: CHEF_IDS derived from NON_CHEF_CATEGORY_IDS (exported from categories.ts)
const CHEF_IDS = new Set(
  categories.filter(c => !NON_CHEF_CATEGORY_IDS.has(c.id)).map(c => c.id),
)

interface HomeAppProps {
  /** All articles metadata (no content) — safe to embed in page HTML */
  articles: ArticleMeta[]
}

export default function HomeApp({ articles }: HomeAppProps) {
  const nonEmptyCategories = useMemo(() => {
    const articleCategoryIds = new Set(articles.map(a => a.category))
    return categories.filter(c => articleCategoryIds.has(c.id))
  }, [articles])

  const statsArticleCount = articles.length
  // F-21: "Шеф-кондитеров" = number of CHEF categories that have at least one
  // article. The old logic counted unique `author` strings, which were source
  // citations like "AFP, Michelin Guide, Pastry Workshop" — wildly inflated.
  const statsAuthorCount = useMemo(() => {
    const articleCats = new Set(articles.map(a => a.category))
    return categories.filter(c => CHEF_IDS.has(c.id) && articleCats.has(c.id)).length
  }, [articles])
  const statsCategoryCount = useMemo(() => {
    const articleCats = new Set(articles.map(a => a.category))
    return categories.filter(c => articleCats.has(c.id)).length
  }, [articles])

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('q') ?? ''
  })
  const [commandOpen, setCommandOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark'
    const saved = safeGetItem('theme')
    // Dark is the default style of the site.
    // Only switch to light when the user has explicitly chosen it.
    if (saved === 'light') return 'light'
    return 'dark'
  })

  // F-12: MobileBottomBar auto-hide on scroll down, show on scroll up
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
    // BUG FIX: Tailwind v4 dark variant targets .dark on html only — adding to body was redundant
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), [])

  // F-03 helper: update URL search param
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

  // GAP-08/F-01: Fuse.js for page search — same algorithm as CommandPalette.
  // CRITICAL FIX: includeMatches:true so we can do accurate fuzzy highlighting
  // in ArticlesGrid (old split-by-regex approach missed transliteration matches).
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

  // matchMap: articleId → Fuse match array, used for accurate highlighting in ArticlesGrid
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

  // F-03: Sync search query to URL ?q=
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

  // Stable callbacks for CommandPalette — prevents quickActions useMemo from
  // recomputing on every render because of new inline-function references.
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
          onOpenCommand={() => setCommandOpen(true)}
          visible={barVisible}
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
