import { useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useReducedMotion } from 'framer-motion'
import { canonMedia, type CanonMediaId } from '../data/canon-media'
import { prefetchRoute } from '../utils/navigation'
import LuxuryText from './LuxuryText'
import '../styles/canon-gateway.css'

const GATEWAY_IMAGE = '/images/canon-sucre/canon-gateway-hero.webp'
const GATEWAY_WORKS = [
  'saint-honore',
  'opera',
  'ispahan',
  'mont-blanc',
  'galette-des-rois',
  'canele-bordeaux',
] as const satisfies readonly CanonMediaId[]
const GATEWAY_IMAGE_ALT = `Le Canon Sucré: ${GATEWAY_WORKS
  .map((id) => canonMedia[id].imageAlt.split(':')[0])
  .join(', ')} на тёмных каменных подставках`

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
    node.style.setProperty('--canon-rx', `${(-ny * 0.3).toFixed(2)}deg`)
    node.style.setProperty('--canon-ry', `${(nx * 0.35).toFixed(2)}deg`)
    node.style.setProperty('--canon-mx', `${((nx + 1) * 50).toFixed(1)}%`)
    node.style.setProperty('--canon-my', `${((ny + 1) * 50).toFixed(1)}%`)
  }

  const reset = () => {
    const node = ref.current
    if (!node) return
    node.style.setProperty('--canon-rx', '0deg')
    node.style.setProperty('--canon-ry', '0deg')
    node.style.setProperty('--canon-mx', '68%')
    node.style.setProperty('--canon-my', '54%')
  }

  return (
    <section className="canon-gateway-section" aria-labelledby="canon-gateway-title">
      <a
        ref={ref}
        href="/canon/"
        className="canon-gateway"
        onPointerEnter={(event) => { if (event.pointerType === 'mouse') prefetchRoute('/canon/') }}
        onPointerMove={onPointerMove}
        onPointerLeave={reset}
        onFocus={() => prefetchRoute('/canon/')}
        onBlur={reset}
      >
        <span className="canon-gateway-media" aria-hidden="true">
          <img
            src={GATEWAY_IMAGE}
            alt={GATEWAY_IMAGE_ALT}
            width={1916}
            height={821}
            loading="lazy"
            decoding="async"
          />
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
          <span className="canon-gateway-meta">15 PIÈCES · 3 ACTES · 1 COLLECTION</span>
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
