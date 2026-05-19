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
  const letters: ReactNode[] = children.split('').map((char, i) => (
    <span className="luxury-letter" key={`${char}-${i}`} aria-hidden="true">
      {char === ' ' ? '\u00A0' : char}
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
