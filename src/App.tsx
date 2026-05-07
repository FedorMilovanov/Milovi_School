import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Fuse from 'fuse.js'
import Header from './components/Header'
import Hero from './components/Hero'
import ToastContainer from './components/Toast'
import KeyboardHelp from './components/KeyboardHelp'
import ArchiveToolbar from './components/ArchiveToolbar'
import DashboardBento from './components/DashboardBento'
import StatsBar from './components/StatsBar'
import Categories from './components/Categories'
import ArticlesGrid from './components/ArticlesGrid'
import ArticleView from './components/ArticleView'
import ContinueReading from './components/ContinueReading'
import ShowcaseSlider from './components/ShowcaseSlider'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'
import CommandPalette from './components/CommandPalette'
import MobileBottomBar from './components/MobileBottomBar'
import ScrollProgress from './components/ScrollProgress'
import ScrollToTop from './components/ScrollToTop'
import UpdateNotification from './components/UpdateNotification'
import { type Article } from './data/articles'
import { categories } from './data/categories'
import { libraryArticles, libraryMeta } from './data/library'
import { safeGetItem, safeSetItem } from './utils/storage'

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark'
    const saved = safeGetItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    document.body.classList.toggle('dark', theme === 'dark')
    safeSetItem('theme', theme)
  }, [theme])

  return { theme, setTheme }
}

export default function App() {
  const { theme, setTheme } = useTheme()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'relevance' | 'readTime' | 'title' | 'latest'>('relevance')
  const [searchQuery, setSearchQuery] = useState('')
  const [commandOpen, setCommandOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<'home' | 'archive' | 'articles' | 'about'>('home')
  const archiveScrollRef = useRef(0)

  const availableTags = useMemo(
    () =>
      Array.from(new Set(libraryArticles.flatMap((a) => a.tags ?? [])))
        .sort((a, b) => a.localeCompare(b, 'ru'))
        .slice(0, 14),
    [],
  )

  const visibleArticles = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase()
    let pool = libraryArticles.filter((article) => {
      const matchesCategory = selectedCategory ? article.category === selectedCategory : true
      const matchesTag = selectedTag ? (article.tags ?? []).includes(selectedTag) : true
      return matchesCategory && matchesTag
    })

    if (normalized) {
      const fuse = new Fuse(pool, {
        keys: [
          { name: 'title', weight: 0.35 },
          { name: 'excerpt', weight: 0.2 },
          { name: 'author', weight: 0.15 },
          { name: 'tags', weight: 0.15 },
          { name: 'content', weight: 0.15 },
        ],
        threshold: 0.38,
        ignoreLocation: true,
        minMatchCharLength: 2,
      })
      pool = fuse.search(normalized).map((result) => result.item)
    }

    if (sortBy !== 'relevance') {
      pool = [...pool].sort((a, b) => {
        switch (sortBy) {
          case 'latest':
            return (b.date ?? '').localeCompare(a.date ?? '')
          case 'readTime':
            return (b.readTime ?? 0) - (a.readTime ?? 0)
          case 'title':
            return a.title.localeCompare(b.title, 'ru')
          default:
            return 0
        }
      })
    }

    return pool
  }, [searchQuery, selectedCategory, selectedTag, sortBy])

  const closeArticle = (restoreScroll = true) => {
    setSelectedArticle(null)
    if (window.location.hash.startsWith('#/article/')) {
      window.history.pushState(null, '', window.location.pathname + window.location.search)
    }
    if (restoreScroll && archiveScrollRef.current > 0) {
      window.requestAnimationFrame(() =>
        window.scrollTo({ top: archiveScrollRef.current, behavior: 'auto' })
      )
    }
  }

  useEffect(() => {
    const syncRoute = () => {
      const match = window.location.hash.match(/^#\/article\/([^/]+)$/)
      if (!match) { setSelectedArticle(null); return }
      const article = libraryArticles.find((item) => item.id === decodeURIComponent(match[1]))
      setSelectedArticle(article ?? null)
    }
    syncRoute()
    window.addEventListener('hashchange', syncRoute)
    window.addEventListener('popstate', syncRoute)
    return () => {
      window.removeEventListener('hashchange', syncRoute)
      window.removeEventListener('popstate', syncRoute)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !isTyping) {
        event.preventDefault()
        setCommandOpen(true)
      }
      if (event.key === 'Escape') {
        // Close command palette first; only close article if palette was already closed
        setCommandOpen((open) => {
          if (open) return false
          // Palette was closed — close article if open (but let ArticleView handle its own Escape)
          return false
        })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, []) // commandOpen state accessed via functional updater — no stale closure

  useEffect(() => {
    if (selectedArticle) return
    const map: Array<[string, typeof activeSection]> = [
      ['hero', 'home'],
      ['archive', 'archive'],
      ['articles', 'articles'],
      ['about', 'about'],
    ]
    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        for (const [id, section] of map) {
          if (visible.has(id)) { setActiveSection(section); return }
        }
      },
      { threshold: 0.08, rootMargin: '-28% 0px -55% 0px' },
    )
    map.forEach(([id]) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [selectedArticle])

  const scrollTo = (id: string) => {
    closeArticle(false)
    // Two rAFs: first waits for React to commit DOM, second for layout/paint
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      )
    )
  }

  const openArticle = (article: Article) => {
    archiveScrollRef.current = window.scrollY
    setSelectedArticle(article)
    setCommandOpen(false)
    window.history.pushState(null, '', `#/article/${encodeURIComponent(article.id)}`)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const goHome = () => {
    setSelectedCategory(null)
    setSelectedTag(null)
    setSortBy('relevance')
    setSearchQuery('')
    closeArticle(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <ErrorBoundary>
      <motion.div
        className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10000] focus:bg-amber-100 focus:px-4 focus:py-3 focus:font-mono focus:text-[11px] focus:uppercase focus:tracking-[0.22em] focus:text-stone-950"
        >
          Перейти к содержанию
        </a>

        <ScrollProgress />

        <Header
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onGoHome={goHome}
          onGoCategories={() => scrollTo('archive')}
          onGoArticles={() => scrollTo('articles')}
          onGoAbout={() => scrollTo('about')}
          onOpenCommand={() => setCommandOpen(true)}
        />

        {selectedArticle ? (
          <main id="main-content">
            <ArticleView
              article={selectedArticle}
              allArticles={libraryMeta}
              onBack={closeArticle}
              onNavigate={(article) =>
                openArticle(
                  libraryArticles.find((item) => item.id === article.id) ?? selectedArticle
                )
              }
            />
          </main>
        ) : (
          <main id="main-content">
            <Hero totalArticles={libraryArticles.length} />
            <StatsBar />
            <ContinueReading articles={libraryArticles} onArticleClick={(meta) => {
              const full = libraryArticles.find((a) => a.id === meta.id)
              if (full) openArticle(full)
            }} />
            <DashboardBento articles={libraryMeta} onArticleClick={(meta) => {
              const full = libraryArticles.find((a) => a.id === meta.id)
              if (full) openArticle(full)
            }} />
            <ShowcaseSlider />
            <Categories
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              allArticles={libraryMeta}
            />
            <ArchiveToolbar
              resultCount={visibleArticles.length}
              availableTags={availableTags}
              activeTag={selectedTag}
              onSelectTag={setSelectedTag}
              sortBy={sortBy}
              onSortChange={setSortBy}
              hasActiveFilters={Boolean(selectedCategory || selectedTag || searchQuery || sortBy !== 'relevance')}
              onReset={() => {
                setSelectedCategory(null)
                setSelectedTag(null)
                setSearchQuery('')
                setSortBy('relevance')
              }}
            />
            <ArticlesGrid
              articles={visibleArticles}
              allArticles={libraryMeta}
              onArticleClick={(meta) => {
                const full = libraryArticles.find((a) => a.id === meta.id)
                if (full) openArticle(full)
              }}
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
            />
            <Footer />
          </main>
        )}

        <CommandPalette
          open={commandOpen}
          articles={libraryMeta}
          theme={theme}
          onClose={() => setCommandOpen(false)}
          onOpenArticle={(article) =>
            openArticle(
              libraryArticles.find((item) => item.id === article.id) ?? libraryArticles[0]
            )
          }
          onGoHome={goHome}
          onGoCategories={() => scrollTo('archive')}
          onGoArticles={() => scrollTo('articles')}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />

        {!selectedArticle && <ScrollToTop />}
        <UpdateNotification />
        <ToastContainer />
        <KeyboardHelp />

        <MobileBottomBar
          onGoHome={goHome}
          onGoCategories={() => scrollTo('archive')}
          onGoArticles={() => scrollTo('articles')}
          onOpenCommand={() => setCommandOpen(true)}
          activeSection={activeSection}
          visible={!selectedArticle}
        />
      </motion.div>
    </ErrorBoundary>
  )
}
