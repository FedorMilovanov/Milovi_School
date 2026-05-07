import { useState } from 'react'
import { motion } from 'framer-motion'

export type ReadingPrefs = {
  fontSize: 'small' | 'normal' | 'large'
  lineHeight: 'normal' | 'relaxed' | 'spacious'
  contrast: 'normal' | 'high'
}

interface ReadingSettingsProps {
  prefs: ReadingPrefs
  onChange: (prefs: ReadingPrefs) => void
  onClose: () => void
  focusMode: boolean
  onFocusMode: (enabled: boolean) => void
}

export default function ReadingSettings({ prefs, onChange, onClose, focusMode, onFocusMode }: ReadingSettingsProps) {
  const [local, setLocal] = useState<ReadingPrefs>(prefs)

  const update = (partial: Partial<ReadingPrefs>) => {
    const next = { ...local, ...partial }
    setLocal(next)
    onChange(next)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/60 backdrop-blur-sm md:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
        <motion.div
          className="w-full max-w-md border-t border-[var(--border-subtle)] bg-[var(--bg-main)] p-5 shadow-2xl md:border md:p-6"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 60 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber-800 dark:text-amber-200">Настройки чтения</p>
            <button type="button" onClick={onClose} className="font-mono text-xs uppercase tracking-[0.2em] text-stone-400 hover:text-stone-950 dark:hover:text-amber-100">Готово</button>
          </div>

          <div className="space-y-6">
            {/* Font Size */}
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">Размер текста</p>
              <div className="flex gap-2">
                {(['small', 'normal', 'large'] as const).map((size) => (
                  <button key={size} onClick={() => update({ fontSize: size })} className={`flex-1 border py-2 text-sm transition ${local.fontSize === size ? 'border-stone-950 bg-stone-950 text-amber-50 dark:border-amber-100 dark:bg-amber-100 dark:text-stone-950' : 'border-[var(--border-subtle)] text-stone-600 hover:border-stone-400 dark:text-stone-400'}`}>
                    {size === 'small' ? 'Мелкий' : size === 'normal' ? 'Обычный' : 'Крупный'}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height */}
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">Межстрочный интервал</p>
              <div className="flex gap-2">
                {(['normal', 'relaxed', 'spacious'] as const).map((lh) => (
                  <button key={lh} onClick={() => update({ lineHeight: lh })} className={`flex-1 border py-2 text-sm transition ${local.lineHeight === lh ? 'border-stone-950 bg-stone-950 text-amber-50 dark:border-amber-100 dark:bg-amber-100 dark:text-stone-950' : 'border-[var(--border-subtle)] text-stone-600 hover:border-stone-400 dark:text-stone-400'}`}>
                    {lh === 'normal' ? 'Стандарт' : lh === 'relaxed' ? 'Комфорт' : 'Простор'}
                  </button>
                ))}
              </div>
            </div>

            {/* Contrast */}
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-stone-500">Контраст</p>
              <div className="flex gap-2">
                {(['normal', 'high'] as const).map((c) => (
                  <button key={c} onClick={() => update({ contrast: c })} className={`flex-1 border py-2 text-sm transition ${local.contrast === c ? 'border-stone-950 bg-stone-950 text-amber-50 dark:border-amber-100 dark:bg-amber-100 dark:text-stone-950' : 'border-[var(--border-subtle)] text-stone-600 hover:border-stone-400 dark:text-stone-400'}`}>
                    {c === 'normal' ? 'Стандартный' : 'Высокий'}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Mode */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onFocusMode(!focusMode)}
                className="w-full border border-[var(--border-subtle)] py-3 text-sm font-mono uppercase tracking-[0.22em] transition hover:bg-stone-950 hover:text-amber-50 dark:hover:bg-amber-100 dark:hover:text-stone-950"
              >
                {focusMode ? 'Выйти из фокус-режима' : 'Включить фокус-режим'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
  )
}
