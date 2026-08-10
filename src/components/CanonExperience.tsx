import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  canonActs,
  canonWorks,
  canonWorksByAct,
  type CanonActId,
  type CanonWork,
} from '../data/canon'
import { prefetchRoute } from '../utils/navigation'
import LuxuryText from './LuxuryText'
import CanonResearchTimeline from './CanonResearchTimeline'
import CanonTechniqueMatrix from './CanonTechniqueMatrix'
import '../styles/canon.css'

const pad = (value: number) => String(value).padStart(2, '0')

function CanonActRail({ activeAct }: { activeAct: CanonActId }) {
  return (
    <nav className="canon-act-rail" aria-label="Навигация по актам Le Canon Sucré">
      {canonActs.map((act) => (
        <a
          key={act.id}
          href={`#canon-act-${act.id}`}
          className={`canon-act-rail-link ${activeAct === act.id ? 'is-active' : ''}`}
          aria-label={`Перейти к акту ${act.roman}: ${act.title}`}
          aria-current={activeAct === act.id ? 'location' : undefined}
        >
          <span className="canon-act-rail-roman">{act.roman}</span>
        </a>
      ))}
    </nav>
  )
}

function CanonWorkCard({ work }: { work: CanonWork }) {
  const mediaRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const destination = work.articleId ? `/articles/${work.articleId}/` : null

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!work.isAnchor || reduceMotion || event.pointerType !== 'mouse') return
    const media = mediaRef.current
    if (!media) return
    const rect = media.getBoundingClientRect()
    const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    media.style.setProperty('--canon-work-rx', `${(-ny * 1.25).toFixed(2)}deg`)
    media.style.setProperty('--canon-work-ry', `${(nx * 1.4).toFixed(2)}deg`)
    media.style.setProperty('--canon-work-mx', `${((nx + 1) * 50).toFixed(1)}%`)
    media.style.setProperty('--canon-work-my', `${((ny + 1) * 50).toFixed(1)}%`)
  }

  const resetTilt = () => {
    const media = mediaRef.current
    if (!media) return
    media.style.setProperty('--canon-work-rx', '0deg')
    media.style.setProperty('--canon-work-ry', '0deg')
    media.style.setProperty('--canon-work-mx', '70%')
    media.style.setProperty('--canon-work-my', '25%')
  }

  const warmDestination = () => {
    if (destination) prefetchRoute(destination)
  }

  const content = (
    <>
      <div
        ref={mediaRef}
        className={`canon-work-media canon-tone-${work.visualTone} has-image`}
        onPointerMove={onPointerMove}
        onPointerLeave={resetTilt}
      >
        <picture className="canon-work-picture">
          {work.imageMobile && <source media="(max-width: 620px)" srcSet={work.imageMobile} />}
          <img
            src={work.image}
            alt={work.imageAlt}
            width={1280}
            height={800}
            loading="lazy"
            decoding="async"
            className="canon-work-image"
          />
        </picture>
        <span className="canon-work-sheen" aria-hidden="true" />
      </div>

      <div className="canon-work-label">
        <div className="canon-work-heading-row">
          <span className="canon-work-number">{pad(work.order)}</span>
          <span className="canon-work-name">{work.name}</span>
        </div>

        {work.curatorLine && <p className="canon-work-curator">{work.curatorLine}</p>}

        {work.techniques && work.techniques.length > 0 && (
          <div className="canon-work-techniques" aria-label={`Ключевые элементы: ${work.techniques.join(', ')}`}>
            {work.techniques.map((technique) => <span key={technique}>{technique}</span>)}
          </div>
        )}

        <div className="canon-work-footer-row">
          <span className="canon-work-rule" aria-hidden="true" />
          {work.articleId && (
            <span className="canon-work-cta">
              {work.linkLabel ?? 'Открыть материал'} <span aria-hidden="true">→</span>
            </span>
          )}
        </div>
      </div>
    </>
  )

  const gridStyle = {
    '--canon-grid-row': work.gridRow,
    '--canon-grid-start': work.gridStart,
    '--canon-grid-span': work.gridSpan,
  } as CSSProperties

  return (
    <article
      id={`canon-${work.id}`}
      data-canon-order={work.order}
      className={`canon-work ${work.isAnchor ? 'canon-work-anchor' : ''} has-media`}
      style={gridStyle}
    >
      {destination ? (
        <a
          href={destination}
          className="canon-work-link"
          aria-label={`${work.linkLabel ?? 'Открыть материал'}: ${work.name}`}
          onPointerEnter={(event) => { if (event.pointerType === 'mouse') warmDestination() }}
          onFocus={warmDestination}
        >
          {content}
        </a>
      ) : (
        <div className="canon-work-static">
          {content}
        </div>
      )}
    </article>
  )
}

export default function CanonExperience() {
  const reduceMotion = useReducedMotion()
  const [activeAct, setActiveAct] = useState<CanonActId>('forme')
  const [railVisible, setRailVisible] = useState(false)

  useEffect(() => {
    const nodes = canonActs
      .map((act) => document.getElementById(`canon-act-${act.id}`))
      .filter((node): node is HTMLElement => Boolean(node))

    if (!nodes.length || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible) return
        const act = visible.target.getAttribute('data-canon-act') as CanonActId | null
        if (act) setActiveAct(act)
      },
      { rootMargin: '-28% 0px -58% 0px', threshold: [0, 0.05, 0.15, 0.3] },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const region = document.getElementById('canon-acts')
    if (!region || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => setRailVisible(Boolean(entry?.isIntersecting)),
      { rootMargin: '-12% 0px -12% 0px', threshold: [0, 0.01] },
    )

    observer.observe(region)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (reduceMotion || typeof IntersectionObserver === 'undefined') return

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.canon-work'))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const node = entry.target as HTMLElement
          const order = Number(node.dataset.canonOrder ?? 1)
          if (typeof node.animate === 'function') {
            node.animate(
              [
                { opacity: 0.001, transform: 'translateY(22px)' },
                { opacity: 1, transform: 'translateY(0)' },
              ],
              {
                duration: 680,
                delay: ((Math.max(1, order) - 1) % 5) * 35,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'none',
              },
            )
          }
          observer.unobserve(node)
        }
      },
      { threshold: 0.12 },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [reduceMotion])

  return (
    <main id="main-content" className="canon-page">
      {railVisible && (
        <div className="hidden min-[1600px]:block">
          <CanonActRail activeAct={activeAct} />
        </div>
      )}

      <section className="canon-hero" aria-labelledby="canon-title">
        <div className="canon-shell canon-hero-inner">
          <motion.p
            className="canon-hero-label"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            PÂTISSERIE RUSSE · COLLECTION 01
          </motion.p>

          <motion.h1
            id="canon-title"
            className="canon-hero-title"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <LuxuryText tone="gold" as="span">LE CANON</LuxuryText><br />
            <LuxuryText tone="gold" as="span">SUCRÉ</LuxuryText>
          </motion.h1>

          <div className="canon-hero-deck">
            <motion.p
              className="canon-hero-intro"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.65, delay: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              15 десертов. Три акта. Формы, техники и переосмысления, ставшие профессиональным языком французской pâtisserie.
            </motion.p>
            <motion.p
              className="canon-hero-count"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.28 }}
            >
              15 PIÈCES<br />3 ACTES<br />1 COLLECTION
            </motion.p>
          </div>
        </div>
      </section>

      <section className="canon-section canon-shell canon-manifesto" aria-labelledby="canon-manifesto-title">
        <div>
          <span className="canon-section-kicker">MANIFESTE</span>
          <h2 id="canon-manifesto-title">Qu’est-ce qu’un canon&nbsp;?</h2>
        </div>
        <p>
          Это не рейтинг «лучших десертов». Le Canon Sucré — кураторский маршрут по формам, которые закрепили технику, пережили эпоху, стали профессиональным ориентиром или получили настолько сильное переосмысление, что вошли в современный язык pâtisserie.
        </p>
      </section>

      <nav className="canon-index" aria-label="Индекс Le Canon Sucré">
        <div className="canon-shell canon-index-grid">
          {canonWorks.map((work) => (
            <a key={work.id} href={`#canon-${work.id}`} className="canon-index-link">
              <span className="canon-index-number">{pad(work.order)}</span>
              <span className="canon-index-name">{work.name}</span>
            </a>
          ))}
        </div>
      </nav>

      <div id="canon-acts" className="canon-shell canon-acts">
        {canonActs.map((act, actIndex) => {
          const nextAct = canonActs[actIndex + 1]
          return (
            <section
              key={act.id}
              id={`canon-act-${act.id}`}
              data-canon-act={act.id}
              className="canon-act"
              aria-labelledby={`canon-act-title-${act.id}`}
            >
              <header className="canon-act-head">
                <div>
                  <span className="canon-act-kicker">ACTE {act.roman}</span>
                  <h2 id={`canon-act-title-${act.id}`} className="canon-act-title">{act.title}</h2>
                </div>
                <p className="canon-act-subtitle">{act.subtitle}</p>
              </header>

              <div className="canon-work-grid">
                {canonWorksByAct(act.id).map((work) => <CanonWorkCard key={work.id} work={work} />)}
              </div>

              {nextAct && (
                <a
                  className="canon-act-transition group no-underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-8 focus-visible:outline-amber-200/70"
                  href={`#canon-act-${nextAct.id}`}
                  aria-label={`Перейти к акту ${nextAct.roman}: ${nextAct.title}`}
                >
                  <span className="canon-act-transition-current transition-colors duration-500 group-hover:text-amber-200/75 motion-reduce:transition-none">
                    ACTE {act.roman}
                  </span>
                  <span className="canon-act-transition-line transition-[filter,transform] duration-500 group-hover:scale-x-[1.04] group-hover:brightness-150 motion-reduce:transition-none" aria-hidden="true" />
                  <span className="canon-act-transition-next flex items-center gap-2 transition-transform duration-500 group-hover:translate-y-0.5 motion-reduce:transition-none">
                    <span>ACTE {nextAct.roman}</span>
                    <strong className="font-normal text-amber-100/65 transition-colors duration-500 group-hover:text-amber-100 motion-reduce:transition-none">{nextAct.title}</strong>
                    <span className="canon-act-transition-arrow text-amber-200/45" aria-hidden="true">↓</span>
                  </span>
                </a>
              )}
            </section>
          )
        })}
      </div>

      <CanonResearchTimeline />
      <CanonTechniqueMatrix />

      <section className="canon-end">
        <div className="canon-shell">
          <span className="canon-end-count">15 / 15</span>
          <h2 className="canon-end-title">LE CANON<br />CONTINUE.</h2>
          <p>Канон — не закрытая витрина. Он остаётся системой форм и техник, которые можно читать рядом, сравнивать и заново понимать через современную pâtisserie.</p>
          <a href="/materials/" className="canon-end-link">Вернуться в библиотеку →</a>
        </div>
      </section>
    </main>
  )
}
