import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { isHapticEnabled, setHapticEnabled, vibrateLight } from '../utils/haptic'
import { isSoundEnabled, playTickSound, setSoundEnabled } from '../utils/sound'
import { safeGetItem, safeSetItem } from '../utils/storage'

type Mood = {
  id: string
  name: string
  fr: string
  light: string
  dark: string
  hex: string
}

const moods: Mood[] = [
  { id: 'amber',   name: 'Янтарь',   fr: 'Ambre',    light: '#92400e', dark: '#d9a455', hex: '#d97706' },
  { id: 'rose',    name: 'Роза',     fr: 'Rose',     light: '#be123c', dark: '#fb7185', hex: '#f43f5e' },
  { id: 'truffle', name: 'Трюфель',  fr: 'Truffe',   light: '#292524', dark: '#a8a29e', hex: '#78716c' },
  { id: 'violet',  name: 'Фиалка',   fr: 'Violette', light: '#5b21b6', dark: '#a78bfa', hex: '#7c3aed' },
  { id: 'sage',    name: 'Шалфей',   fr: 'Sauge',    light: '#166534', dark: '#86efac', hex: '#16a34a' },
]

/** Hex → rgba с заданной прозрачностью */
function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/**
 * Инжектирует <style> тег, который переопределяет хардкодные Tailwind amber-классы.
 * Это позволяет смене гаммы реально менять цвет всех элементов на странице,
 * даже тех, что используют text-amber-800 / dark:text-amber-200 вместо var(--text-accent).
 */
function injectAccentStyles(mood: Mood, isDark: boolean) {
  const lightColor = mood.light
  const darkColor = mood.dark
  const hex = mood.hex

  let el = document.getElementById('bespoke-accent-override') as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = 'bespoke-accent-override'
    document.head.appendChild(el)
  }

  // CSS var — основа для всего нового кода
  document.documentElement.style.setProperty('--text-accent', isDark ? darkColor : lightColor)

  if (mood.id === 'amber') {
    // Убираем все overrides — возвращаем к умолчаниям
    el.textContent = ''
    return
  }

  el.textContent = `
    /* ── Bespoke Accent: ${mood.name} ── */

    /* CSS переменная */
    :root { --text-accent: ${lightColor} !important; }
    .dark { --text-accent: ${darkColor} !important; }

    /* === Светлая тема === */
    html:not(.dark) .text-amber-800,
    html:not(.dark) .hover\\:text-amber-800:hover { color: ${lightColor} !important; }

    html:not(.dark) .text-amber-700 { color: ${lightColor}cc !important; }

    html:not(.dark) .text-amber-600,
    html:not(.dark) .hover\\:text-amber-600:hover { color: ${hex} !important; }

    html:not(.dark) .text-amber-400,
    html:not(.dark) .text-amber-300,
    html:not(.dark) .text-amber-200 { color: ${hex} !important; }

    html:not(.dark) .text-amber-100 { color: ${hexAlpha(hex, 0.85)} !important; }

    html:not(.dark) .bg-amber-100,
    html:not(.dark) .hover\\:bg-amber-100:hover { background-color: ${hexAlpha(hex, 0.15)} !important; }

    html:not(.dark) .border-amber-100,
    html:not(.dark) .hover\\:border-amber-100:hover { border-color: ${hexAlpha(hex, 0.35)} !important; }

    /* Opacity variants */
    html:not(.dark) [class*="text-amber-200\\/"] { color: ${hexAlpha(hex, 0.8)} !important; }
    html:not(.dark) [class*="text-amber-300\\/"] { color: ${hexAlpha(hex, 0.7)} !important; }
    html:not(.dark) [class*="border-amber-100\\/"] { border-color: ${hexAlpha(hex, 0.3)} !important; }

    /* === Тёмная тема === */
    .dark .text-amber-100,
    .dark .dark\\:text-amber-100 { color: ${darkColor} !important; }

    .dark .text-amber-200,
    .dark .dark\\:text-amber-200 { color: ${darkColor} !important; }

    .dark .text-amber-300,
    .dark .dark\\:text-amber-300 { color: ${hex} !important; }

    .dark .group:hover .dark\\:group-hover\\:text-amber-100,
    .dark .dark\\:group-hover\\:text-amber-100 { color: ${darkColor} !important; }

    .dark .bg-amber-100,
    .dark .dark\\:bg-amber-100 { background-color: ${hexAlpha(hex, 0.2)} !important; }

    .dark .text-stone-950.dark\\:bg-amber-100,
    .dark .dark\\:text-stone-950 { color: #11100e !important; }

    /* Opacity variants dark */
    .dark [class*="text-amber-200\\/"] { color: ${hexAlpha(hex, 0.85)} !important; }

    /* Градиент для scroll progress bar */
    .scroll-progress {
      background: linear-gradient(90deg, ${darkColor}, ${lightColor}) !important;
    }

    /* Gradient accent stop in hero */
    html:not(.dark) .from-amber-800 { --tw-gradient-from: ${lightColor} !important; }
    .dark .dark\\:from-amber-800 { --tw-gradient-from: ${darkColor} !important; }

    /* Selection */
    ::selection {
      background: ${hexAlpha(hex, 0.35)} !important;
    }
  `
}

export default function BespokeAccentPicker() {
  const [activeMood, setActiveMood] = useState(() => safeGetItem('pref-accent-mood') || 'amber')
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled())
  const [hapticOn, setHapticOn] = useState(() => isHapticEnabled())
  const [isOpen, setIsOpen] = useState(false)

  // Apply CSS variable on mount and mood change
  useEffect(() => {
    safeSetItem('pref-accent-mood', activeMood)
    const current = moods.find((m) => m.id === activeMood) || moods[0]
    const apply = () => {
      const isDark = document.documentElement.classList.contains('dark')
      injectAccentStyles(current, isDark)
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [activeMood])

  const active = moods.find((m) => m.id === activeMood) || moods[0]

  const open = () => { setIsOpen(true); playTickSound(0.04); vibrateLight() }
  const close = () => { setIsOpen(false); playTickSound(0.03) }

  const selectMood = (id: string) => {
    setActiveMood(id)
    playTickSound(0.06)
    vibrateLight()
  }

  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    setSoundEnabled(next)
    if (next) playTickSound(0.06)
  }

  const toggleHaptic = () => {
    const next = !hapticOn
    setHapticOn(next)
    setHapticEnabled(next)
    if (next) vibrateLight()
  }

  return (
    <div className="fixed bottom-24 left-4 z-40 md:bottom-8">
      {/* Trigger button — a pure SVG diamond with the active color */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            onClick={open}
            className="group relative flex h-11 w-11 items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            aria-label="Настройка атмосферы"
          >
            {/* Outer border ring */}
            <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full">
              <rect
                x="2" y="2" width="40" height="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.75"
                className="text-stone-400/40 dark:text-stone-600/40"
              />
              {/* Corner accents */}
              <path d="M2 8 L2 2 L8 2" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-stone-500/60 dark:text-stone-500/40" />
              <path d="M36 2 L42 2 L42 8" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-stone-500/60 dark:text-stone-500/40" />
              <path d="M2 36 L2 42 L8 42" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-stone-500/60 dark:text-stone-500/40" />
              <path d="M36 42 L42 42 L42 36" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-stone-500/60 dark:text-stone-500/40" />
            </svg>

            {/* Diamond gem — the accent color */}
            <svg viewBox="0 0 20 20" className="relative h-5 w-5" style={{ filter: `drop-shadow(0 0 4px ${active.hex}66)` }}>
              {/* Gem facets */}
              <polygon points="10,2 18,8 10,18 2,8" fill={active.hex} opacity="0.9" />
              <polygon points="10,2 18,8 10,10" fill="white" opacity="0.22" />
              <polygon points="10,2 2,8 10,10" fill="white" opacity="0.08" />
              <polygon points="10,18 18,8 10,10" fill="black" opacity="0.18" />
              <polygon points="10,18 2,8 10,10" fill="black" opacity="0.08" />
              <polygon points="10,2 18,8 10,18 2,8" fill="none" stroke="white" strokeWidth="0.4" opacity="0.3" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-0 left-0 w-64 origin-bottom-left"
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Panel border with SVG corners */}
            <div className="relative border border-[var(--border-subtle)] bg-[var(--bg-overlay-95)] shadow-2xl backdrop-blur-xl">

              {/* SVG corner decorations */}
              <svg viewBox="0 0 256 1" className="absolute -top-px left-0 right-0 h-px w-full overflow-visible" preserveAspectRatio="none">
                <line x1="0" y1="0" x2="256" y2="0" stroke={active.hex} strokeWidth="1" opacity="0.5" />
              </svg>

              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
                <div className="flex items-center gap-2.5">
                  {/* Small gem icon */}
                  <svg viewBox="0 0 14 14" className="h-3 w-3 flex-shrink-0">
                    <polygon points="7,1 13,5 7,13 1,5" fill={active.hex} opacity="0.85" />
                    <polygon points="7,1 13,5 7,6" fill="white" opacity="0.25" />
                    <polygon points="7,13 13,5 7,6" fill="black" opacity="0.2" />
                  </svg>
                  <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-stone-500 dark:text-stone-400">
                    Атмосфера
                  </span>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="flex h-6 w-6 items-center justify-center text-stone-400 transition hover:text-stone-950 dark:hover:text-stone-100"
                  aria-label="Закрыть"
                >
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M1 1l10 10M11 1L1 11" />
                  </svg>
                </button>
              </div>

              {/* Accent swatches */}
              <div className="px-4 py-3.5">
                <p className="mb-2.5 font-mono text-[8px] uppercase tracking-[0.28em] text-stone-400">
                  Акцентный цвет
                </p>
                <div className="flex gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood.id}
                      type="button"
                      onClick={() => selectMood(mood.id)}
                      className="group relative flex flex-col items-center gap-1.5"
                      title={mood.name}
                    >
                      {/* Swatch */}
                      <div className="relative">
                        <svg viewBox="0 0 24 24" className="h-8 w-8 transition-transform duration-200 group-hover:scale-110">
                          <polygon points="12,2 22,9 12,22 2,9" fill={mood.hex} opacity={activeMood === mood.id ? 1 : 0.45} />
                          <polygon points="12,2 22,9 12,12" fill="white" opacity="0.2" />
                          <polygon points="12,22 22,9 12,12" fill="black" opacity="0.18" />
                          <polygon
                            points="12,2 22,9 12,22 2,9"
                            fill="none"
                            stroke={activeMood === mood.id ? mood.hex : 'transparent'}
                            strokeWidth="1.5"
                            opacity="0.6"
                          />
                        </svg>
                        {activeMood === mood.id && (
                          <motion.div
                            layoutId="swatch-ring"
                            className="absolute -inset-1 border"
                            style={{ borderColor: mood.hex + '60' }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </div>
                      <span className="font-mono text-[7px] uppercase tracking-[0.15em] text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200">
                        {mood.fr}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="mx-4 border-t border-[var(--border-subtle)]" />

              {/* Sound & Haptic toggles */}
              <div className="px-4 py-3">
                <p className="mb-2 font-mono text-[8px] uppercase tracking-[0.28em] text-stone-400">
                  Обратная связь
                </p>
                <div className="space-y-1">
                  {/* Sound toggle */}
                  <button
                    type="button"
                    onClick={toggleSound}
                    className="flex w-full items-center justify-between py-1.5 text-left transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-stone-500" fill="none" stroke="currentColor" strokeWidth="1.5">
                        {soundOn ? (
                          <>
                            <path d="M2 6h3l4-3v10l-4-3H2z" strokeLinejoin="round" />
                            <path d="M11 5c1.333 1 1.333 5 0 6" strokeLinecap="round" />
                            <path d="M13 3c2 2 2 8 0 10" strokeLinecap="round" />
                          </>
                        ) : (
                          <>
                            <path d="M2 6h3l4-3v10l-4-3H2z" strokeLinejoin="round" />
                            <path d="M13 6l-3 4M10 6l3 4" strokeLinecap="round" />
                          </>
                        )}
                      </svg>
                      <span className="text-xs text-stone-600 dark:text-stone-400">Звук</span>
                    </div>
                    {/* Toggle pill */}
                    <div className={`relative h-4 w-7 rounded-none transition-colors duration-200 ${soundOn ? 'bg-stone-950 dark:bg-amber-100' : 'bg-stone-200 dark:bg-stone-700'}`}>
                      <motion.div
                        className={`absolute top-0.5 h-3 w-3 ${soundOn ? 'bg-amber-100 dark:bg-stone-950' : 'bg-stone-500 dark:bg-stone-400'}`}
                        animate={{ x: soundOn ? 14 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </div>
                  </button>

                  {/* Haptic toggle */}
                  <button
                    type="button"
                    onClick={toggleHaptic}
                    className="flex w-full items-center justify-between py-1.5 text-left transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-stone-500" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="5" y="3" width="6" height="10" rx="3" />
                        <path d="M3 6c-1 0.7-1 3.3 0 4" strokeLinecap="round" />
                        <path d="M13 6c1 0.7 1 3.3 0 4" strokeLinecap="round" />
                        <path d="M1 5c-1.5 1.5-1.5 4.5 0 6" strokeLinecap="round" />
                        <path d="M15 5c1.5 1.5 1.5 4.5 0 6" strokeLinecap="round" />
                      </svg>
                      <span className="text-xs text-stone-600 dark:text-stone-400">Вибро</span>
                    </div>
                    <div className={`relative h-4 w-7 rounded-none transition-colors duration-200 ${hapticOn ? 'bg-stone-950 dark:bg-amber-100' : 'bg-stone-200 dark:bg-stone-700'}`}>
                      <motion.div
                        className={`absolute top-0.5 h-3 w-3 ${hapticOn ? 'bg-amber-100 dark:bg-stone-950' : 'bg-stone-500 dark:bg-stone-400'}`}
                        animate={{ x: hapticOn ? 14 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </div>
                  </button>
                </div>
              </div>

              {/* Active mood name footer */}
              <div className="border-t border-[var(--border-subtle)] px-4 py-2">
                <p className="font-mono text-[8px] uppercase tracking-[0.3em]" style={{ color: active.hex }}>
                  {active.name} · {active.fr}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
