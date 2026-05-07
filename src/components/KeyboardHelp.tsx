import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function KeyboardHelp() {
  const [open, setOpen] = useState(false)
  const isMac = typeof navigator !== 'undefined' && /mac|iphone|ipad|ipod/i.test(navigator.userAgent)

  const shortcuts = [
    { keys: [isMac ? '⌘' : 'Ctrl', 'K'], label: 'Быстрый поиск по библиотеке' },
    { keys: ['Esc'], label: 'Закрыть статью / окно' },
    { keys: ['↑', '↓'], label: 'Навигация в результатах поиска' },
    { keys: ['Enter'], label: 'Открыть выбранный материал' },
    { keys: ['?'], label: 'Показать это окно' },
  ]

  const openRef = useRef(open)
  useEffect(() => { openRef.current = open }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'
      if (e.key === '?' && !isTyping && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape' && openRef.current) setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <div data-modal-open="true" className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0"
            style={{ backgroundColor: 'rgba(12,10,9,0.55)', backdropFilter: 'blur(6px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md border shadow-2xl p-8"
            style={{ backgroundColor: 'var(--bg-command)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {/* keyboard icon */}
                <svg className="h-5 w-5" style={{ color: 'var(--text-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h1M9 11h1m4-4h1m-1 4h1M5 7h1M5 11h1M5 15h14M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
                </svg>
                <h2 className="font-serif text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Горячие клавиши
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer p-1 transition-opacity hover:opacity-60"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Закрыть"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {shortcuts.map((shortcut) => (
                <div
                  key={shortcut.label}
                  className="flex items-center justify-between py-2 border-b"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {shortcut.label}
                  </span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key) => (
                      <kbd
                        key={key}
                        className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 border rounded font-mono text-[10px]"
                        style={{
                          backgroundColor: 'var(--bg-deep)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 font-mono text-[9px] uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>
              Нажмите{' '}
              <kbd className="border px-1 rounded" style={{ borderColor: 'var(--border-subtle)' }}>?</kbd>
              {' '}чтобы закрыть
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
