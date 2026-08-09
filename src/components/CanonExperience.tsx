import { useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { canonActs, canonWorks, canonWorksByAct, type CanonWork } from '../data/canon'
import '../styles/canon.css'

const pad = (value: number) => String(value).padStart(2, '0')

function CanonWorkCard({ work }: { work: CanonWork }) {
  const mediaRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!work.isAnchor || reduceMotion || event.pointerType !== 'mouse') return
    const media = mediaRef.current
    if (!media) return
    const rect = media.getBoundingClientRect()
    const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    media.style.setProperty('--canon-work-rx', `${(-ny * 1.25).toFixed(2)}deg`)
    media.style.setProperty('--canon-work-ry', `${(nx * 1.4).toFixed(2)}deg`)
  }

  const resetTilt = () => {
    const media = mediaRef.current
    if (!media) return
    media.style.setProperty('--canon-work-rx', '0deg')
    media.style.setProperty('--canon-work-ry', '0deg')
  }

  const content = (
    <>
      <div
        ref={mediaRef}
        className={`canon-work-media canon-tone-${work.visualTone}`}
        onPointerMove={onPointerMove}
        onPointerLeave={resetTilt}
      >
        {work.image ? (
          <picture>
            {work.imageMobile && <source media="(max-width: 620px)" srcSet={work.imageMobile} />}
            <img src={work.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </picture>
        ) : (
          <span className="canon-placeholder-object" aria-hidden="true" />
        )}
      </div>
      <div className="canon-work-label">
        <span className="canon-work-number">{pad(work.order)}</span>
        <span className="canon-work-name">{work.name}</span>
        <span className="canon-work-status">DOSSIER · RESEARCH</span>
        <span className="canon-work-rule" aria-hidden="true" />
      </div>
    </>
  )

  return (
    <article id={`canon-${work.id}`} className={`canon-work ${work.isAnchor ? 'canon-work-anchor' : ''}`}>
      {work.articleId ? (
        <a href={`/articles/${work.articleId}/`} className="canon-work-link" aria-label={`Открыть досье: ${work.name}`}>
          {content}
        </a>
      ) : (
        <div className="canon-work-static" aria-label={`${work.name}: досье будет подключено после Research`}>
          {content}
        </div>
      )}
    </article>
  )
}

function ResearchModule({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <aside className="canon-research-module">
      <span className="canon-module-label">{label}</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </aside>
  )
}

export default function CanonExperience() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="canon-page">
      <section className="canon-hero" aria-labelledby="canon-title">
        <div className="canon-shell canon-hero-inner">
          <motion.p
            className="canon-hero-label"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : .55, ease: [0.22, 1, 0.36, 1] }}
          >
            PÂTISSERIE RUSSE · COLLECTION 01
          </motion.p>
          <motion.h1
            id="canon-title"
            className="canon-hero-title luxury-color-text"
            data-tone="gold"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : .8, delay: reduceMotion ? 0 : .08, ease: [0.22, 1, 0.36, 1] }}
          >
            LE CANON<br />SUCRÉ
          </motion.h1>
          <div className="canon-hero-deck">
            <motion.p
              className="canon-hero-intro"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : .65, delay: reduceMotion ? 0 : .18, ease: [0.22, 1, 0.36, 1] }}
            >
              15 десертов. Три акта. Формы, техники и переосмысления, ставшие профессиональным языком французской pâtisserie.
            </motion.p>
            <motion.p
              className="canon-hero-count"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : .7, delay: reduceMotion ? 0 : .28 }}
            >
              15 PIÈCES<br />3 ACTES<br />RESEARCH IN PROGRESS
            </motion.p>
          </div>
        </div>
      </section>

      <main>
        <section className="canon-section canon-shell canon-manifesto" aria-labelledby="canon-manifesto-title">
          <div>
            <span className="canon-section-kicker">MANIFESTE</span>
            <h2 id="canon-manifesto-title">Qu’est-ce qu’un canon&nbsp;?</h2>
          </div>
          <p>
            Это не рейтинг «лучших десертов». Le Canon Sucré — кураторский маршрут по формам, которые закрепили технику, пережили эпоху, стали профессиональным ориентиром или получили настолько сильное переосмысление, что изменили современную pâtisserie. Исторические даты, атрибуции и архивные свидетельства подключаются только после закрытия Research.
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

        <div className="canon-shell">
          {canonActs.map((act, actIndex) => (
            <section key={act.id} className="canon-act" aria-labelledby={`canon-act-${act.id}`}>
              <header className="canon-act-head">
                <div>
                  <span className="canon-act-kicker">ACTE {act.roman}</span>
                  <h2 id={`canon-act-${act.id}`} className="canon-act-title">{act.title}</h2>
                </div>
                <p className="canon-act-subtitle">{act.subtitle}</p>
              </header>

              <div className="canon-work-grid">
                {canonWorksByAct(act.id).map((work) => <CanonWorkCard key={work.id} work={work} />)}
              </div>

              {actIndex === 0 && (
                <ResearchModule label="ARCHIVE · SLOT 01" title="Документ как экспонат">
                  Здесь появится первое подтверждённое факсимиле — страница книги, меню, реклама или газетное свидетельство с provenance, точным локатором и правами. Viewer и «музейное стекло» уже предусмотрены архитектурой, но реальный объект не подставляется до rights gate.
                </ResearchModule>
              )}

              {actIndex === 1 && (
                <ResearchModule label="LÉGENDE / DOCUMENT" title="Легенда не равна факту">
                  Этот модуль будет включаться только там, где Research действительно обнаружит конфликт между популярной историей и документальным свидетельством. Никаких красных FALSE-бейджей: две версии будут показаны спокойно, с разной доказательной массой.
                </ResearchModule>
              )}

              {actIndex === 2 && (
                <ResearchModule label="ATLAS / TECHNIQUE" title="От списка к системе">
                  Финальный слой свяжет подтверждённые места происхождения и профессиональные техники. Карта и матрица не получают декоративных точек: только доказанные территории и закрытые составные/технологические связи.
                </ResearchModule>
              )}
            </section>
          ))}
        </div>

        <section className="canon-end">
          <div className="canon-shell">
            <span className="canon-end-count">15 / 15</span>
            <h2 className="canon-end-title">LE CANON<br />CONTINUE.</h2>
            <p>Пятнадцать — не музейная витрина, запертая навсегда. Research должен показать, что действительно выдерживает критерий канона, что остаётся сильным резервом и что красивее оставить за пределами коллекции.</p>
            <a href="/materials/" className="canon-end-link">Вернуться в библиотеку →</a>
          </div>
        </section>
      </main>
    </div>
  )
}
