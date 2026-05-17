import { motion, AnimatePresence } from 'framer-motion'


type ActiveSection = 'home' | 'archive' | 'articles' | 'about'

interface MobileBottomBarProps {
  onGoHome: () => void
  onGoCategories: () => void
  onGoArticles: () => void
  onGoAbout?: () => void
  onOpenCommand: () => void
  activeSection?: ActiveSection
  visible?: boolean
}

const tabs = [
  { id: 'home', label: 'Домой' },
  { id: 'archive', label: 'Архив' },
  { id: 'articles', label: 'Статьи' },
  { id: 'about', label: 'О нас' },
  { id: 'search', label: 'Поиск' },
] as const

function Icon({ id, active }: { id: string; active: boolean }) {
  // aria-hidden — accompanying <span> already provides the accessible label,
  // so the icon must be invisible to screen readers (otherwise VoiceOver
  // double-announces "icon, Архив").
  const cls = `h-4 w-4 transition ${active ? 'text-stone-950 dark:text-amber-100' : 'text-stone-600 dark:text-stone-400'}`
  const common = { className: cls, fill: 'none' as const, viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.5, 'aria-hidden': true, focusable: false as const }
  if (id === 'home') {
    return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" /></svg>
  }
  if (id === 'archive') {
    return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
  }
  if (id === 'articles') {
    return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
  }
  if (id === 'about') {
    return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
  }
  return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" /></svg>
}

export default function MobileBottomBar({ onGoHome, onGoCategories, onGoArticles, onGoAbout, onOpenCommand, activeSection = 'home', visible = true }: MobileBottomBarProps) {
  const actionById: Record<string, () => void> = {
    home: onGoHome,
    archive: onGoCategories,
    articles: onGoArticles,
    about: onGoAbout ?? (() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })),
    search: onOpenCommand,
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          aria-label="Основная навигация" role="tablist"
          className="fixed inset-x-4 bottom-5 z-40 md:hidden"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 32, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        >
          <div className="pointer-events-none absolute -inset-[2px] rounded-[18px] bg-[linear-gradient(135deg,rgba(217,164,85,0.3),transparent_50%,rgba(146,64,14,0.2))] opacity-40 blur-[6px]" />
          <div className="relative overflow-hidden rounded-[16px] border border-amber-700/20 bg-[var(--bg-overlay-95)] shadow-xl shadow-black/10 backdrop-blur-xl" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
            <div className="grid grid-cols-5 items-center justify-items-center py-2">
              {tabs.map((tab) => {
                const active = tab.id !== 'search' && activeSection === tab.id
                const ariaLabel = tab.id === 'search' ? 'Открыть поиск' : tab.label
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    onClick={() => actionById[tab.id]()}
                    className="relative flex w-full flex-col items-center gap-1 py-1 text-center transition active:scale-95"
                    aria-current={active ? 'page' : undefined}
                    aria-selected={active}
                    aria-label={ariaLabel}
                  >
                    {active && <motion.span layoutId="mobile-active-pill" className="absolute inset-x-2 inset-y-0 rounded-[12px] bg-stone-950/5 dark:bg-amber-100/10" aria-hidden="true" />}
                    <span className="relative"><Icon id={tab.id} active={active} /></span>
                    <span className={`relative font-mono text-[9px] uppercase tracking-[0.16em] transition ${active ? 'text-stone-950 dark:text-amber-100' : 'text-stone-500 dark:text-stone-400'}`}>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}
