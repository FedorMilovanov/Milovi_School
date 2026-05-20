import { lazy, Suspense, useState, useCallback, useEffect, useMemo } from 'react'
import Header from '../Header'
import Footer from '../Footer'
import ErrorBoundary from '../ErrorBoundary'
import Cursor from '../Cursor'
import type { ArticleClientMeta } from '../../data/types'
import { categories } from '../../data/categories'
import { fallbackImageFor } from '../../assets/images'
import LuxuryText from '../LuxuryText'
import { navigateTo } from '../../utils/navigation'
import { safeSetItem } from '../../utils/storage'

const CommandPalette = lazy(() => import('../CommandPalette'))

const clampIndex = (value: number, length: number) => (value + length) % length

export default function GalleryApp({ articles }: { articles: ArticleClientMeta[] }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [commandOpen, setCommandOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach((category) => map.set(category.id, category.name))
    return map
  }, [])

  const previewArticle = previewIndex === null ? null : articles[previewIndex] ?? null
  const previewImage = previewArticle ? previewArticle.image || fallbackImageFor(previewArticle.category) : ''
  const previewCategory = previewArticle ? categoryNameById.get(previewArticle.category) ?? previewArticle.category : ''

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    if (previewArticle === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPreviewIndex(null)
      } else if (event.key === 'ArrowRight') {
        setPreviewIndex((current) => current === null ? current : clampIndex(current + 1, articles.length))
      } else if (event.key === 'ArrowLeft') {
        setPreviewIndex((current) => current === null ? current : clampIndex(current - 1, articles.length))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [articles.length, previewArticle])

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

  const openPreview = useCallback((index: number) => {
    setPreviewIndex(index)
  }, [])

  const goPreview = useCallback((direction: -1 | 1) => {
    setPreviewIndex((current) => current === null ? current : clampIndex(current + direction, articles.length))
  }, [articles.length])

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
              {articles.map((article, index) => {
                const imgUrl = article.image || fallbackImageFor(article.category)
                const categoryLabel = categoryNameById.get(article.category) ?? article.category
                return (
                  <a
                    key={article.id}
                    href={`/articles/${article.id}/`}
                    onMouseEnter={() => openPreview(index)}
                    onFocus={() => openPreview(index)}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return
                      e.preventDefault()
                      openArticle(article)
                    }}
                    className="cat-img-card cat-img-card-lux group relative block cursor-pointer overflow-hidden bg-[var(--cream)] text-left transition-colors"
                    aria-describedby={`gallery-card-meta-${article.id}`}
                  >
                    <div
                      className="cat-card-img-wrap-lux relative aspect-[4/5] overflow-hidden"
                      style={{ ['--cat-bg' as string]: `url(${imgUrl})` }}
                    >
                      <img
                        src={imgUrl}
                        alt={article.imageAlt ?? article.title}
                        loading="lazy"
                        decoding="async"
                        sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="cat-img cat-card-img-lux h-full w-full object-cover"
                      />
                      <div className="cat-overlay-lux absolute inset-0 z-[2]" />

                      <div className="cat-card-body-lux absolute inset-x-0 bottom-0 z-[5] p-6">
                        <span className="mb-3.5 inline-block border border-[rgba(212,169,106,0.25)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[rgba(212,169,106,0.75)]">
                          {categoryLabel}
                        </span>
                        <span className="cat-card-name-lux block font-serif text-[1.4rem] font-semibold leading-tight tracking-[-0.03em] text-white">
                          {article.title}
                        </span>
                        <div id={`gallery-card-meta-${article.id}`} className="mt-4 flex items-center justify-between border-t border-[rgba(255,255,255,0.1)] pt-3">
                          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[rgba(212,169,106,0.6)]">
                            {article.readTime} мин чтения
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

        {previewArticle && (
          <aside
            className="gallery-preview-shell fixed inset-x-4 bottom-5 z-50 mx-auto hidden max-w-6xl md:block"
            aria-live="polite"
            aria-label="Предпросмотр материала"
          >
            <div className="gallery-preview-aura" aria-hidden="true" />
            <div className="gallery-preview-card overflow-hidden border border-amber-100/20 bg-[rgba(16,14,12,0.88)] shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl dark:bg-[rgba(10,9,8,0.9)]">
              <div className="grid min-h-[360px] lg:grid-cols-[1.15fr_0.85fr]">
                <div className="gallery-preview-image-wrap relative overflow-hidden bg-stone-950">
                  <img
                    src={previewImage}
                    alt={previewArticle.imageAlt ?? previewArticle.title}
                    className="gallery-preview-image h-[360px] w-full object-cover lg:h-[430px]"
                    decoding="async"
                    sizes="(min-width: 1024px) 56rem, 90vw"
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,236,200,0.22),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.55))]" />
                  <div className="absolute left-6 top-6 border border-white/20 bg-black/35 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.24em] text-amber-100 backdrop-blur-md">
                    {previewIndex !== null ? `${previewIndex + 1}`.padStart(2, '0') : '01'} / {articles.length}
                  </div>
                </div>

                <div className="relative flex flex-col justify-between p-7 text-amber-50 lg:p-9">
                  <button
                    type="button"
                    onClick={() => setPreviewIndex(null)}
                    className="absolute right-5 top-5 border border-amber-100/20 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-amber-100/70 transition hover:border-amber-100/60 hover:bg-amber-100 hover:text-stone-950"
                    aria-label="Свернуть предпросмотр"
                  >
                    Свернуть
                  </button>

                  <div className="pr-28">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-200/65">
                      {previewCategory} · {previewArticle.readTime} мин чтения
                    </p>
                    <h2 className="mt-4 font-serif text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-white">
                      {previewArticle.title}
                    </h2>
                    <p className="mt-5 max-w-xl font-serif text-lg italic leading-8 text-stone-300">
                      {previewArticle.excerpt}
                    </p>
                    {previewArticle.tags.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {previewArticle.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="border border-amber-100/15 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-amber-100/55">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-amber-100/10 pt-5">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => goPreview(-1)}
                        className="gallery-preview-nav"
                        aria-label="Предыдущий материал"
                      >
                        ← Пред.
                      </button>
                      <button
                        type="button"
                        onClick={() => goPreview(1)}
                        className="gallery-preview-nav"
                        aria-label="Следующий материал"
                      >
                        След. →
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => openArticle(previewArticle)}
                      className="gallery-preview-read"
                    >
                      Читать материал →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}

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
