import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { pluralRu, MATERIAL } from '../utils/plural'

interface HeroProps {
  totalArticles: number
  onSelectCategory?: (id: string) => void
}

const MARQUEE_CHEFS = [
  { name: 'Пьер Эрме', id: 'pierre-herme' },
  { name: 'Седрик Гроле', id: 'cedric-grolet' },
  { name: 'Филипп Контисини', id: 'philippe-conticini' },
  { name: 'Янн Куврер', id: 'yann-couvreur' },
  { name: 'Кристоф Мишалак', id: 'christophe-michalak' },
  { name: 'Нина Метайе', id: 'nina-metayer' },
  { name: 'Доминик Ансель', id: 'dominique-ansel' },
  { name: 'Франсуа Перре', id: 'francois-perret' },
  { name: 'Клер Эйцлер', id: 'claire-heitzler' },
  { name: 'Сириль Линьяк', id: 'cyril-lignac' },
  { name: 'Жак Жени', id: 'jacques-genin' },
  { name: 'Кристоф Фельдер', id: 'christophe-felder' },
]

export default function Hero({ totalArticles, onSelectCategory }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldReduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })
  
  // FIX H-2: Single image element, control parallax via style instead of remounting
  const [isMobile, setIsMobile] = useState(false)
  const yParallax = useTransform(scrollYProgress, [0, 1], ['0%', shouldReduce ? '0%' : '26%'])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check, { passive: true })
    return () => window.removeEventListener('resize', check)
  }, [])

  const parallaxStyle = (!shouldReduce && !isMobile) ? { y: yParallax } : undefined

  return (
    <section id="hero" ref={containerRef} className="relative overflow-hidden">
      <div className="absolute inset-0">
        {/* FIX B-2 + H-2: Responsive optimized hero with <picture> */}
        <picture>
          <source
            type="image/avif"
            srcSet="/images/hero-640.avif 640w, /images/hero-1280.avif 1280w, /images/hero-1920.avif 1920w"
            sizes="100vw"
          />
          <source
            type="image/webp"
            srcSet="/images/hero-640.webp 640w, /images/hero-1280.webp 1280w, /images/hero-1920.webp 1920w"
            sizes="100vw"
          />
          <img
            src="/images/hero-1280.jpg"
            alt="Французская кондитерская школа — Patisserie Russe"
            className="h-full w-full object-cover"
            width={1920}
            height={1080}
            fetchPriority="high"
            decoding="async"
            style={parallaxStyle}
          />
        </picture>

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,10,9,0.96),rgba(12,10,9,0.76)_48%,rgba(12,10,9,0.18))]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--bg-main)] to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-[88vh] max-w-7xl items-end px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-4xl hero-text text-white">
          <motion.p
            className="mb-5 font-mono text-[10px] uppercase tracking-[0.38em] text-amber-200/85 sm:text-xs"
            initial={shouldReduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduce ? { duration: 0 } : { duration: 0.7, delay: 0.15 }}
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
            initial={shouldReduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduce ? { duration: 0 } : { duration: 0.9, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            Французская
            <span className="block italic text-amber-100">кондитерская</span>
          </motion.h1>

          <motion.div
            className="mt-8 max-w-2xl border-l border-amber-100/40 pl-6"
            initial={shouldReduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduce ? { duration: 0 } : { duration: 0.7, delay: 0.4 }}
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
            initial={shouldReduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduce ? { duration: 0 } : { duration: 0.7, delay: 0.56 }}
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

      {/* Marquee — FIX H-1: use 2 copies instead of 4 */}
      <div className="relative bg-stone-950/80 backdrop-blur-sm">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />
        <div className="overflow-hidden py-3">
          <div className="animate-marquee flex whitespace-nowrap">
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={i} className="mx-8 inline-flex items-center gap-0 font-mono text-[10px] uppercase tracking-[0.4em]">
                {MARQUEE_CHEFS.map((chef, j) => (
                  <span key={chef.id}>
                    {onSelectCategory ? (
                      <button
                        type="button"
                        onClick={() => onSelectCategory(chef.id)}
                        className="text-stone-500 transition-colors hover:text-amber-400 cursor-pointer"
                        title={`Перейти к материалам — ${chef.name}`}
                      >
                        {chef.name}
                      </button>
                    ) : (
                      <span className="text-stone-500">{chef.name}</span>
                    )}
                    {j < MARQUEE_CHEFS.length - 1 && <span className="text-stone-700 mx-3">·</span>}
                  </span>
                ))}
                <span className="text-stone-700 mx-3">·&nbsp;</span>
              </span>
            ))}
          </div>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />
      </div>
    </section>
  )
}
