import { useState, useCallback, useEffect } from 'react'
import Header from '../Header'
import Footer from '../Footer'
import CommandPalette from '../CommandPalette'
import ErrorBoundary from '../ErrorBoundary'
import Cursor from '../Cursor'
import type { ArticleClientMeta } from '../../data/types'
import { fallbackImageFor } from '../../assets/images'
import LuxuryText from '../LuxuryText'
import { navigateTo } from '../../utils/navigation'

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
        <main className="py-24 transition-colors bg-[var(--bg-deep)]">
          <div className="mx-auto max-w-[1600px] px-6 lg:px-10">
            <div className="mb-16 flex flex-col items-start gap-6 border-b border-[var(--border)] pb-12">
              <h1 className="section-title-lux font-serif text-[clamp(2.8rem,5.5vw,5rem)] font-semibold leading-[0.92] tracking-[-0.07em] text-[var(--ink)]">
                <LuxuryText tone="section" as="span">Библиотека материалов</LuxuryText>
              </h1>
              <p className="max-w-xl font-serif text-lg italic leading-[1.82] text-[var(--ink-50)]">
                Все статьи, рецепты и переводы.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-[2px] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ border: '1px solid var(--border)' }}>
              {articles.map((article) => {
                const imgUrl = article.image || fallbackImageFor(article.category)
                return (
                  <button
                    key={article.id}
                    onClick={() => openArticle(article)}
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
                        className="cat-img cat-card-img-lux h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(175deg,rgba(10,8,7,0)_30%,rgba(10,8,7,0.82)_100%)] transition-all duration-500 group-hover:bg-[linear-gradient(175deg,rgba(10,8,7,0.05)_20%,rgba(10,8,7,0.9)_100%)]" />

                      <div className="absolute inset-x-0 bottom-0 p-6">
                        <span className="mb-3.5 inline-block border border-[rgba(212,169,106,0.25)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[rgba(212,169,106,0.75)]">
                          {article.category}
                        </span>
                        <span className="block font-serif text-[1.4rem] font-semibold leading-tight tracking-[-0.03em] text-white section-title-lux">
                          <LuxuryText tone="about-white" as="span">{article.title}</LuxuryText>
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
                  </button>
                )
              })}
            </div>
          </div>
        </main>
        <Footer />
        <CommandPalette open={commandOpen} articles={articles} onClose={() => setCommandOpen(false)} onOpenArticle={openArticle} />
        <Cursor theme={theme} />
      </ErrorBoundary>
    </div>
  )
}
