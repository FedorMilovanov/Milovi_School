import { lazy, Suspense, useState, useCallback, useEffect } from 'react'
import Header from '../Header'
import Footer from '../Footer'
import ErrorBoundary from '../ErrorBoundary'
import Cursor from '../Cursor'
import type { ArticleClientMeta } from '../../data/types'
import { fallbackImageFor } from '../../assets/images'
import LuxuryText from '../LuxuryText'
import { navigateTo } from '../../utils/navigation'
import { safeSetItem } from '../../utils/storage'

const CommandPalette = lazy(() => import('../CommandPalette'))

export default function GalleryApp({ articles }: { articles: ArticleClientMeta[] }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [commandOpen, setCommandOpen] = useState(false)

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const nt = t === 'dark' ? 'light' : 'dark'
      document.documentElement.style.colorScheme = nt
      document.documentElement.classList.toggle('dark', nt === 'dark')
      safeSetItem('theme', nt)
      const meta = document.getElementById('theme-color-meta')
      if (meta) meta.setAttribute('content', nt === 'dark' ? '#10100f' : '#f5efe5')
      return nt
    })
  }, [])

  const goHome = useCallback(() => {
    navigateTo('/')
  }, [])

  const openArticle = useCallback((article: ArticleClientMeta) => {
    void navigateTo(`/articles/${article.id}/`)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg-main)] transition-colors dark:bg-stone-950">
      <ErrorBoundary>
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          onGoHome={goHome}
          onGoCategories={() => { navigateTo('/#categories') }}
          onGoArticles={() => {}}
          onGoAbout={() => { navigateTo('/#about') }}
          onOpenCommand={() => setCommandOpen(true)}
        />
        <main id="materials" className="bg-[var(--bg-deep)] py-24 transition-colors">
          <div className="mx-auto max-w-[1600px] px-6 lg:px-10">
            <div className="mb-16 flex flex-col items-start gap-6 border-b border-[var(--border)] pb-12">
              <h1 className="section-title-lux font-serif text-[clamp(2.8rem,5.5vw,5rem)] font-semibold leading-[0.92] tracking-[-0.07em] text-[var(--ink)]">
                <LuxuryText tone="section" as="span">Галерея материалов</LuxuryText>
              </h1>
              <p className="max-w-xl font-serif text-lg italic leading-[1.82] text-[var(--ink-50)]">
                Все статьи, рецепты и переводы — визуальная плитка с фотографиями и premium-hover карточек.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-[2px] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ border: '1px solid var(--border)' }}>
              {articles.map((article) => {
                const imgUrl = article.image || fallbackImageFor(article.category)
                return (
                  <a
                    key={article.id}
                    href={`/articles/${article.id}/`}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return
                      e.preventDefault()
                      openArticle(article)
                    }}
                    className="cat-img-card cat-img-card-lux group relative block cursor-pointer overflow-hidden bg-[var(--cream)] text-left transition-colors"
                  >
                    <div
                      className="cat-card-img-wrap-lux relative aspect-[4/5] overflow-hidden"
                      style={{ ['--cat-bg' as string]: `url(${imgUrl})` }}
                    >
                      <img
                        src={imgUrl}
                        alt={article.title}
                        loading="lazy"
                        decoding="async"
                        sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="cat-img cat-card-img-lux h-full w-full object-cover"
                      />
                      <div className="cat-overlay-lux absolute inset-0 z-[2]" />

                      <div className="cat-card-body-lux absolute inset-x-0 bottom-0 z-[5] p-6">
                        <span className="mb-3.5 inline-block border border-[rgba(212,169,106,0.25)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[rgba(212,169,106,0.75)]">
                          {article.category}
                        </span>
                        <span className="cat-card-name-lux block font-serif text-[1.4rem] font-semibold leading-tight tracking-[-0.03em] text-white">
                          {article.title}
                        </span>
                        <div className="mt-4 flex items-center justify-between border-t border-[rgba(255,255,255,0.1)] pt-3">
                          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[rgba(212,169,106,0.6)]">
                            {article.readTime}
                          </span>
                          <div className="flex h-6 w-6 items-center justify-center border border-[rgba(255,255,255,0.2)] transition-all duration-300 group-hover:border-[var(--gold-pale)] group-hover:bg-[var(--gold-pale)]">
                            <svg className="h-2.5 w-2.5 stroke-white transition-[stroke] duration-300 group-hover:stroke-[var(--ink)]" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        </main>
        <Footer />
        {commandOpen && (
          <Suspense fallback={null}>
            <CommandPalette open={commandOpen} articles={articles} onClose={() => setCommandOpen(false)} onOpenArticle={openArticle} />
          </Suspense>
        )}
        <Cursor theme={theme} />
      </ErrorBoundary>
    </div>
  )
}
