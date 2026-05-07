import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { defaultFallback } from '../assets/images'
import { pluralRu, MATERIAL } from '../utils/plural'

interface HeroProps {
  totalArticles: number
}

export default function Hero({ totalArticles }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })
  const [mobile, setMobile] = useState(false)
  const yParallax = useTransform(scrollYProgress, [0, 1], ['0%', '28%'])

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check, { passive: true })
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <section id="hero" ref={containerRef} className="relative overflow-hidden">
      <div className="absolute inset-0">
        {mobile ? (
          <motion.img
            src={defaultFallback}
            alt="Французская кондитерская"
            className="h-full w-full object-cover"
            initial={{ scale: 1.08, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : (
          <motion.img
            src={defaultFallback}
            alt="Французская кондитерская"
            className="h-full w-full object-cover"
            style={{ y: yParallax }}
            initial={{ scale: 1.08, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,10,9,0.96),rgba(12,10,9,0.76)_48%,rgba(12,10,9,0.18))]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--bg-main)] to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-[88vh] max-w-7xl items-end px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-4xl hero-text text-white">
          <motion.p
            className="mb-5 font-mono text-[10px] uppercase tracking-[0.38em] text-amber-200/85 sm:text-xs"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            Patisserie Russe · Образовательный проект{' '}
            <a
              href="https://milovicake.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-300 underline-offset-2 hover:underline"
            >
              Milovi Cake
            </a>
          </motion.p>

          <motion.h1
            className="max-w-4xl font-serif text-[clamp(3.25rem,12vw,9rem)] font-semibold leading-[0.88] tracking-[-0.08em]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            Французская
            <span className="block italic text-amber-100">кондитерская</span>
          </motion.h1>

          <motion.div
            className="mt-8 max-w-2xl border-l border-amber-100/40 pl-6"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <p className="text-lg leading-8 text-stone-100 sm:text-xl sm:leading-9">
              Бесплатная библиотека о французской кондитерской школе на русском языке. Техники, рецепты и разборы от ведущих мировых шефов — без пафоса, с практическим упором.
            </p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.28em] text-amber-200/80">
              {totalArticles}&thinsp;{pluralRu(totalArticles, MATERIAL)} · техники, рецепты, биографии · источники указаны
            </p>
          </motion.div>

          <motion.div
            className="mt-10 flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.56 }}
          >
            <a
              href="#archive"
              className="inline-flex items-center justify-center border border-amber-100 bg-amber-100 px-6 py-4 text-[11px] font-mono uppercase tracking-[0.22em] text-stone-950 transition hover:bg-white"
            >
              Открыть архив
            </a>
            <a
              href="https://milovicake.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border border-white/30 px-6 py-4 text-[11px] font-mono uppercase tracking-[0.22em] text-white transition hover:border-amber-100 hover:text-amber-100"
            >
              Milovi Cake →
            </a>
          </motion.div>
        </div>
      </div>

      {/* Marquee strip — running names of top pastry chefs */}
      <div className="relative bg-stone-950/80 backdrop-blur-sm">
        {/* Top border line with gradient fade at edges */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />
        <div className="overflow-hidden py-3">
          <div className="animate-marquee flex whitespace-nowrap">
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className="mx-8 font-mono text-[10px] uppercase tracking-[0.4em] text-stone-500">
                Пьер Эрме · Седрик Гроле · Филипп Контисини · Янн Куврер · Кристоф Мишалак · Нина Метайе · Доминик Ансель · Франсуа Перре · Клер Эйцлер · Сириль Линьяк · Жак Жени · Кристоф Фельдер ·&nbsp;
              </span>
            ))}
          </div>
        </div>
        {/* Bottom border line with gradient fade at edges */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />
      </div>
    </section>
  )
}
