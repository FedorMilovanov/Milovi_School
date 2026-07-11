/**
 * LuxuryText — обёртка для текста, который должен реагировать на курсор
 * посимвольной подсветкой (через Cursor.tsx → updateLuxuryLetters).
 *
 * Использование:
 *   <LuxuryText tone="title">Французская</LuxuryText>
 *   <LuxuryText tone="platinum" as="em">Pâtisserie</LuxuryText>
 *
 * data-tone подбирает палитру в Cursor.tsx:
 *   - title       → ваниль → золото
 *   - platinum    → синий → ярко-синий (Pâtisserie)
 *   - section     → серый → бронза (заголовки секций)
 *   - about-white → белый → светлое золото
 *
 * Каждая буква — отдельный <span class="luxury-letter">; пробелы
 * заменяются на non-breaking space чтобы layout не схлопывался.
 * display:inline сохраняет естественный кернинг крупного serif.
 */
import { createElement, type ReactNode } from 'react'

interface LuxuryTextProps {
  children: string
  tone?: 'title' | 'platinum' | 'section' | 'gold' | 'about-white' | 'hero-title' | 'hero-plat'
  /** HTML-тег обёртки. По умолчанию — span. Для италика: 'em'. */
  as?: 'span' | 'em' | 'strong' | 'h1' | 'h2'
  className?: string
}

export default function LuxuryText({ children, tone = 'title', as = 'span', className }: LuxuryTextProps) {
  // Inter-word spaces stay real (breaking) spaces so multi-word section titles
  // wrap on narrow viewports. A non-breaking space here forced titles like
  // \u00AB\u0428\u0435\u0444\u044B, \u0442\u0435\u0445\u043D\u0438\u043A\u0438, \u043A\u0443\u0445\u043D\u044F, \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430\u00BB onto one line \u2192 min-content overflow on
  // mobile (grid track widened past the viewport). Letters remain individual
  // spans, so the per-letter cursor effect is unaffected; words stay intact
  // (only spaces are wrap opportunities, never mid-word).
  const letters: ReactNode[] = children.split('').map((char, i) => (
    <span className="luxury-letter" key={`${char}-${i}`} aria-hidden="true">
      {char}
    </span>
  ))
  return createElement(
    as,
    {
      className: `luxury-color-text${className ? ` ${className}` : ''}`,
      'data-tone': tone,
      // aria-label чтобы скринридер читал слово целиком, а не побуквенно.
      'aria-label': children,
    },
    letters,
  )
}
