import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

const INITIAL_HOVER_DELAY = 320
const SWITCH_HOVER_DELAY = 120
const LEAVE_CLOSE_DELAY = 260
const SCROLL_CLOSE_DISTANCE = 24
const PREVIEW_MEDIA_QUERY = '(hover: hover) and (pointer: fine) and (min-width: 1024px)'

type PreviewDock = 'left' | 'right'

type PreviewAnchor = HTMLElement | null

const wrapIndex = (value: number, length: number) => {
  if (length <= 0) return null
  return ((value % length) + length) % length
}

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

export default function GalleryApp({ articles }: { articles: ArticleClientMeta[] }) {
  // Dark is the brand default and must match the server render. The mounted
  // effect then synchronises with the class set by BaseLayout before paint.
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [commandOpen, setCommandOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [previewDock, setPreviewDock] = useState<PreviewDock>('right')
  const [canUsePreview, setCanUsePreview] = useState(false)

  const previewIndexRef = useRef<number | null>(null)
  const hoverTimerRef = useRef<number | null>(null)
  const hoverTimerIndexRef = useRef<number | null>(null)
  const leaveTimerRef = useRef<number | null>(null)
  const activeCardRef = useRef<number | null>(null)
  const suppressedCardRef = useRef<number | null>(null)
  const previewHoveredRef = useRef(false)
  const previewOpenedScrollYRef = useRef(0)
  const previewShellRef = useRef<HTMLElement | null>(null)

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach((category) => map.set(category.id, category.name))
    return map
  }, [])

  const previewArticle = previewIndex === null ? null : articles[previewIndex] ?? null
  const previewImage = previewArticle ? previewArticle.image || fallbackImageFor(previewArticle.category) : ''
  const previewCategory = previewArticle ? categoryNameById.get(previewArticle.category) ?? previewArticle.category : ''

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    hoverTimerIndexRef.current = null
  }, [])

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current !== null) {
      window.clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
  }, [])

  const clearPreviewTimers = useCallback(() => {
    clearHoverTimer()
    clearLeaveTimer()
  }, [clearHoverTimer, clearLeaveTimer])

  const closePreview = useCallback((suppressCurrentCard = false) => {
    clearPreviewTimers()

    if (suppressCurrentCard) {
      suppressedCardRef.current = activeCardRef.current ?? previewIndexRef.current
    }

    activeCardRef.current = null
    previewHoveredRef.current = false
    previewIndexRef.current = null
    setPreviewIndex(null)
  }, [clearPreviewTimers])

  const openPreview = useCallback((index: number, anchor: PreviewAnchor = null) => {
    if (!canUsePreview || !articles[index]) return

    clearPreviewTimers()
    previewOpenedScrollYRef.current = window.scrollY

    // Direct hover chooses the side opposite the card. Navigation inside an
    // already-open panel intentionally keeps the current dock stable.
    if (anchor) {
      const rect = anchor.getBoundingClientRect()
      const cardCenter = rect.left + rect.width / 2
      setPreviewDock(cardCenter < window.innerWidth / 2 ? 'right' : 'left')
    }

    previewIndexRef.current = index
    setPreviewIndex(index)
  }, [articles, canUsePreview, clearPreviewTimers])

  const schedulePreview = useCallback((index: number, anchor: PreviewAnchor) => {
    if (!canUsePreview || !articles[index]) return
    if (suppressedCardRef.current === index) return

    activeCardRef.current = index
    clearLeaveTimer()

    if (previewIndexRef.current === index || hoverTimerIndexRef.current === index) return

    clearHoverTimer()
    hoverTimerIndexRef.current = index
    const delay = previewIndexRef.current === null ? INITIAL_HOVER_DELAY : SWITCH_HOVER_DELAY

    hoverTimerRef.current = window.setTimeout(() => {
      hoverTimerRef.current = null
      hoverTimerIndexRef.current = null
      if (activeCardRef.current !== index || suppressedCardRef.current === index) return
      openPreview(index, anchor)
    }, delay)
  }, [articles, canUsePreview, clearHoverTimer, clearLeaveTimer, openPreview])

  const scheduleClosePreview = useCallback(() => {
    clearLeaveTimer()
    leaveTimerRef.current = window.setTimeout(() => {
      leaveTimerRef.current = null
      if (activeCardRef.current === null && !previewHoveredRef.current) {
        closePreview(false)
      }
    }, LEAVE_CLOSE_DELAY)
  }, [clearLeaveTimer, closePreview])

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')

    const mediaQuery = window.matchMedia(PREVIEW_MEDIA_QUERY)
    setCanUsePreview(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => setCanUsePreview(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    previewIndexRef.current = previewIndex
  }, [previewIndex])

  useEffect(() => {
    if (canUsePreview) return
    suppressedCardRef.current = null
    closePreview(false)
  }, [canUsePreview, closePreview])

  useEffect(() => {
    if (previewIndex === null) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePreview(true)
        return
      }
      if (isEditableTarget(event.target)) return

      const current = previewIndexRef.current
      if (current === null) return

      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        const direction = event.key === 'ArrowRight' ? 1 : -1
        const next = wrapIndex(current + direction, articles.length)
        if (next !== null) {
          event.preventDefault()
          openPreview(next)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [articles.length, closePreview, openPreview, previewIndex])

  useEffect(() => {
    if (previewIndex === null) return

    const handleScroll = () => {
      if (Math.abs(window.scrollY - previewOpenedScrollYRef.current) >= SCROLL_CLOSE_DISTANCE) {
        closePreview(true)
      }
    }
    const handleWindowBlur = () => closePreview(true)
    const handleVisibilityChange = () => {
      if (document.hidden) closePreview(true)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('blur', handleWindowBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('blur', handleWindowBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [closePreview, previewIndex])

  useEffect(() => {
    if (previewIndex === null) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (previewShellRef.current?.contains(target)) return
      if (target.closest('[data-gallery-index]')) return
      closePreview(true)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [closePreview, previewIndex])

  useEffect(() => () => clearPreviewTimers(), [clearPreviewTimers])

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
      document.documentElement.style.colorScheme = nextTheme
      document.documentElement.classList.toggle('dark', nextTheme === 'dark')
      safeSetItem('theme', nextTheme)
      document.getElementById('theme-color-meta')?.setAttribute(
        'content',
        nextTheme === 'dark' ? '#10100f' : '#f5efe5',
      )
      return nextTheme
    })
  }, [])

  const goHome = useCallback(() => {
    void navigateTo('/')
  }, [])

  const goMaterials = useCallback(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('materials')?.scrollIntoView({
      block: 'start',
      behavior: reducedMotion ? 'auto' : 'smooth',
    })
  }, [])

  const openArticle = useCallback((article: ArticleClientMeta) => {
    void navigateTo(`/articles/${article.id}/`)
  }, [])

  const goPreview = useCallback((direction: -1 | 1) => {
    const current = previewIndexRef.current
    if (current === null) return
    const next = wrapIndex(current + direction, articles.length)
    if (next !== null) openPreview(next)
  }, [articles.length, openPreview])

  return (
    <div className="min-h-screen bg-[var(--bg-main)] transition-colors dark:bg-stone-950">
      <ErrorBoundary>
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          onGoHome={goHome}
          onGoCategories={() => { void navigateTo('/#categories') }}
          onGoArticles={goMaterials}
          onGoAbout={() => { void navigateTo('/#about') }}
          onOpenCommand={() => setCommandOpen(true)}
        />
        <main id="materials" className="bg-[var(--bg-deep)] py-24 transition-colors">
          <div className="mx-auto max-w-[1600px] px-6 lg:px-10">
            <div className="mb-16 flex flex-col items-start gap-6 border-b border-[var(--border)] pb-12">
              <h1 className="section-title-lux font-serif text-[clamp(2.8rem,5.5vw,5rem)] font-semibold leading-[0.92] tracking-[-0.07em] text-[var(--ink)]">
                <LuxuryText tone="section" as="span">Галерея материалов</LuxuryText>
              </h1>
              <p className="max-w-xl font-serif text-lg italic leading-[1.82] text-[var(--ink-50)]">
                Все статьи, рецепты и переводы — в визуальной галерее с аккуратным предпросмотром при наведении.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-[2px] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {articles.map((article, index) => {
                const imgUrl = article.image || fallbackImageFor(article.category)
                const categoryLabel = categoryNameById.get(article.category) ?? article.category

                return (
                  <a
                    key={article.id}
                    data-gallery-index={index}
                    href={`/articles/${article.id}/`}
                    onPointerEnter={(event) => {
                      if (event.pointerType !== 'mouse' || !canUsePreview) return
                      activeCardRef.current = index
                      clearLeaveTimer()
                    }}
                    onPointerMove={(event) => {
                      if (event.pointerType !== 'mouse' || !canUsePreview) return
                      activeCardRef.current = index
                      schedulePreview(index, event.currentTarget)
                    }}
                    onPointerLeave={() => {
                      if (activeCardRef.current === index) activeCardRef.current = null
                      if (suppressedCardRef.current === index) suppressedCardRef.current = null
                      if (hoverTimerIndexRef.current === index) clearHoverTimer()
                      scheduleClosePreview()
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
                          <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center border border-[rgba(255,255,255,0.2)] transition-all duration-300 group-hover:border-[var(--gold-pale)] group-hover:bg-[var(--gold-pale)]">
                            <svg className="h-2.5 w-2.5 stroke-white transition-[stroke] duration-300 group-hover:stroke-[var(--ink)]" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        </main>

        {previewArticle && canUsePreview && (
          <aside
            id="gallery-preview"
            ref={previewShellRef}
            data-dock={previewDock}
            role="region"
            aria-labelledby={`gallery-preview-title-${previewArticle.id}`}
            className={`gallery-preview-shell fixed bottom-5 z-50 hidden w-[min(calc(100vw-2rem),900px)] md:block ${previewDock === 'right' ? 'right-4' : 'left-4'}`}
            onPointerEnter={() => {
              previewHoveredRef.current = true
              clearLeaveTimer()
            }}
            onPointerLeave={() => {
              previewHoveredRef.current = false
              scheduleClosePreview()
            }}
          >
            <div className="gallery-preview-aura" aria-hidden="true" />
            <div className="gallery-preview-card overflow-hidden border border-amber-100/20 bg-[rgba(16,14,12,0.88)] shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl dark:bg-[rgba(10,9,8,0.9)]">
              <div key={previewArticle.id} className="grid min-h-[360px] lg:grid-cols-[1.15fr_0.85fr]">
                <div className="gallery-preview-image-wrap relative overflow-hidden bg-stone-950">
                  <img
                    src={previewImage}
                    alt={previewArticle.imageAlt ?? previewArticle.title}
                    className="gallery-preview-image h-[360px] w-full object-cover lg:h-[430px]"
                    loading="eager"
                    decoding="async"
                  />
                  <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,236,200,0.22),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.55))]" />
                  <div className="absolute left-6 top-6 border border-white/20 bg-black/35 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.24em] text-amber-100 backdrop-blur-md">
                    {`${(previewIndex ?? 0) + 1}`.padStart(2, '0')} / {articles.length}
                  </div>
                </div>

                <div className="relative flex flex-col justify-between p-7 text-amber-50 lg:p-9">
                  <button
                    type="button"
                    onClick={() => closePreview(true)}
                    className="absolute right-5 top-5 border border-amber-100/20 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-amber-100/70 transition hover:border-amber-100/60 hover:bg-amber-100 hover:text-stone-950"
                    aria-label="Свернуть предпросмотр"
                  >
                    Свернуть
                  </button>

                  <div className="pr-28">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-200/65">
                      {previewCategory} · {previewArticle.readTime} мин чтения
                    </p>
                    <h2 id={`gallery-preview-title-${previewArticle.id}`} className="mt-4 font-serif text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-white">
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
                    <a
                      href={`/articles/${previewArticle.id}/`}
                      className="gallery-preview-read"
                    >
                      Читать материал →
                    </a>
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
