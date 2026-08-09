import { useRef } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { useReducedMotion } from 'framer-motion'
import { canonWorks } from '../data/canon'
import LuxuryText from './LuxuryText'
import '../styles/canon.css'

const GATEWAY_SELECTION = [
  { id: 'paris-brest', position: '50% 50%' },
  { id: 'opera', position: '50% 50%' },
  { id: 'ispahan', position: '50% 48%' },
  { id: 'mont-blanc', position: '50% 48%' },
  { id: 'galette-des-rois', position: '50% 50%' },
] as const

const MEDIA = GATEWAY_SELECTION.map((selection) => {
  const work = canonWorks.find((item) => item.id === selection.id)
  if (!work?.image) throw new Error(`[canon-gateway] Missing collection media for ${selection.id}`)
  return { id: selection.id, src: work.image, position: selection.position }
})

export default function CanonGateway() {
  const ref = useRef<HTMLAnchorElement>(null)
  const reduceMotion = useReducedMotion()

  const onPointerMove = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (reduceMotion || event.pointerType !== 'mouse') return
    const node = ref.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    node.style.setProperty('--canon-rx', `${(-ny * 1.15).toFixed(2)}deg`)
    node.style.setProperty('--canon-ry', `${(nx * 1.35).toFixed(2)}deg`)
    node.style.setProperty('--canon-mx', `${((nx + 1) * 50).toFixed(1)}%`)
    node.style.setProperty('--canon-my', `${((ny + 1) * 50).toFixed(1)}%`)
  }

  const reset = () => {
    const node = ref.current
    if (!node) return
    node.style.setProperty('--canon-rx', '0deg')
    node.style.setProperty('--canon-ry', '0deg')
    node.style.setProperty('--canon-mx', '72%')
    node.style.setProperty('--canon-my', '38%')
  }

  return (
    <section className="canon-gateway-section" aria-labelledby="canon-gateway-title">
      <a
        ref={ref}
        href="/canon/"
        className="canon-gateway"
        onPointerMove={onPointerMove}
        onPointerLeave={reset}
        onBlur={reset}
      >
        <span className="canon-gateway-media" aria-hidden="true">
          {MEDIA.map((media, index) => (
            <span
              key={media.id}
              className={`canon-gateway-media-item canon-gateway-media-${media.id}`}
              style={{ '--canon-i': index } as CSSProperties}
            >
              <img src={media.src} alt="" loading="lazy" decoding="async" style={{ objectPosition: media.position }} />
            </span>
          ))}
        </span>

        <span className="canon-gateway-vignette" aria-hidden="true" />
        <span className="canon-gateway-light" aria-hidden="true" />
        <span className="canon-gateway-grain" aria-hidden="true" />

        <span className="canon-gateway-copy">
          <span className="canon-eyebrow">ÉDITION SPÉCIALE</span>
          <span id="canon-gateway-title" className="canon-gateway-title">
            <LuxuryText tone="gold">LE CANON SUCRÉ</LuxuryText>
          </span>
          <span className="canon-gateway-subtitle">15 форм, ставших языком французской pâtisserie</span>
          <span className="canon-gateway-meta">15 PIÈCES · 3 ACTES</span>
          <span className="canon-gateway-cta">
            <span>Открыть коллекцию</span>
            <span className="canon-gateway-arrow" aria-hidden="true">→</span>
          </span>
        </span>

        <span className="canon-frame canon-frame-a" aria-hidden="true" />
        <span className="canon-frame canon-frame-b" aria-hidden="true" />
      </a>
    </section>
  )
}
