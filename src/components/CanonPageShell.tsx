import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Header from './Header'
import Footer from './Footer'
import CanonExperience, { type CanonDossier } from './CanonExperience'
import Cursor from './Cursor'
import ScrollProgress from './ScrollProgress'
import ScrollToTop from './ScrollToTop'
import ToastContainer from './Toast'
import UpdateNotification from './UpdateNotification'
import ErrorBoundary from './ErrorBoundary'
import { safeSetItem } from '../utils/storage'
import { navigateTo } from '../utils/navigation'
import { useArticleIndex } from '../hooks/useArticleIndex'
import type { ArticleClientMeta } from '../data/types'

const CommandPalette = lazy(() => import('./CommandPalette'))

const THEME_LIGHT = '#f5efe5'
const THEME_DARK = '#10100f'

export default function CanonPageShell({ dossiers }: { dossiers: Record<string, CanonDossier> }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [themeReady, setThemeReady] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const commandOpenRef = useRef(false)
  const searchStatusDialogRef = useRef<HTMLDivElement | null>(null)
  // Search metadata is fetched on first open instead of being serialized into
  // the page: /canon/ used to carry ~144 KB of unused article props.
  const { index: searchIndex, status: searchStatus, retry: retrySearch } = useArticleIndex(commandOpen)

  useEffect(() => { commandOpenRef.current = commandOpen }, [commandOpen])

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    setThemeReady(true)
  }, [])

  useEffect(() => {
    if (!themeReady) return
    safeSetItem('theme', theme)
    const root = document.documentElement
    root.style.colorScheme = theme
    root.classList.toggle('dark', theme === 'dark')
    const meta = document.getElementById('theme-color-meta')
    if (meta) meta.setAttribute('content', theme === 'dark' ? THEME_DARK : THEME_LIGHT)
  }, [theme, themeReady])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA') {
        if (commandOpenRef.current && target?.closest('[role="dialog"]')) return
        event.preventDefault()
        setCommandOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const toggleTheme = useCallback(() => setTheme((value) => value === 'dark' ? 'light' : 'dark'), [])
  const closeCommand = useCallback(() => setCommandOpen(false), [])
  const openArticle = useCallback((article: ArticleClientMeta) => { void navigateTo(`/articles/${article.id}/`) }, [])

  /**
   * The loading/error dialog is a real modal, so it owes the keyboard contract a
   * modal owes: focus moves inside on open, Tab stays inside, Escape closes it,
   * the page behind does not scroll, and focus returns to whatever opened it.
   * `aria-modal="true"` alone does none of that — it is an announcement, not
   * behaviour. Applies only while the status dialog is on screen; once the index
   * resolves, CommandPalette owns focus with its own implementation.
   */
  const searchStatusVisible = commandOpen && searchIndex === null
  useEffect(() => {
    if (!searchStatusVisible) return
    const dialog = searchStatusDialogRef.current
    if (!dialog) return

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusables = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
    const first = focusables()[0] ?? dialog
    first.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setCommandOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault()
        lastItem.focus()
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault()
        firstItem.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      if (previouslyFocused && previouslyFocused.isConnected) previouslyFocused.focus()
    }
  }, [searchStatusVisible])

  return (
    <div className="min-h-screen bg-[var(--bg-main)] transition-colors dark:bg-stone-950">
      <ErrorBoundary>
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          onGoHome={() => { void navigateTo('/') }}
          onGoCategories={() => { void navigateTo('/#categories') }}
          onGoArticles={() => { void navigateTo('/materials/') }}
          onGoAbout={() => { void navigateTo('/#about') }}
          onOpenCommand={() => setCommandOpen((value) => !value)}
        />

        <CanonExperience dossiers={dossiers} />
        <Footer />

        {commandOpen && (
          searchIndex ? (
            <Suspense fallback={null}>
              <CommandPalette
                open={commandOpen}
                articles={searchIndex}
                onClose={closeCommand}
                onOpenArticle={openArticle}
                initialQuery=""
              />
            </Suspense>
          ) : (
            <div
              ref={searchStatusDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="canon-search-loading-title"
              tabIndex={-1}
              className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 px-4 pt-[12vh] outline-none"
            >
              <div className="w-full max-w-lg rounded-xl border border-stone-700 bg-stone-950 p-6 text-stone-100 shadow-2xl">
                <h2 id="canon-search-loading-title" className="text-xl font-semibold">Поиск по библиотеке</h2>
                {searchStatus === 'error' ? (
                  <div className="mt-4 space-y-3">
                    <p role="alert">Не удалось загрузить каталог поиска. Проверьте соединение.</p>
                    <button
                      type="button"
                      className="rounded-lg border border-stone-500 px-4 py-2"
                      onClick={() => {
                        retrySearch()
                        searchStatusDialogRef.current?.focus()
                      }}
                    >
                      Повторить загрузку
                    </button>
                    <a className="block underline" href="/materials/">Открыть галерею материалов</a>
                  </div>
                ) : (
                  <p role="status" className="mt-4 text-stone-300">Загружаем каталог поиска…</p>
                )}
                <button
                  type="button"
                  className="mt-6 rounded-lg border border-stone-600 px-4 py-2 text-sm"
                  onClick={closeCommand}
                >
                  Закрыть
                </button>
              </div>
            </div>
          )
        )}

        <UpdateNotification />
        <ToastContainer />
        <ScrollProgress />
        <ScrollToTop />
        <Cursor theme={theme} />
      </ErrorBoundary>
    </div>
  )
}
