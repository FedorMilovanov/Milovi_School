import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface AnimatedCounterProps {
  target: number
  suffix?: string
  prefix?: string
  label: string
  onClick?: () => void
}

function AnimatedCounter({ target, suffix = '', prefix = '', label, onClick }: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  const frameRef = useRef<number | null>(null)
  const shouldReduce = useReducedMotion()

  useEffect(() => {
    started.current = false
    setCount(0)
    if (shouldReduce) {
      setCount(target)
      return
    }
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return
        started.current = true
        const duration = 1400
        const startTime = performance.now()
        const step = (now: number) => {
          const elapsed = now - startTime
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.round(eased * target))
          if (progress < 1) frameRef.current = requestAnimationFrame(step)
        }
        frameRef.current = requestAnimationFrame(step)
      },
      { threshold: 0.3 },
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [target, shouldReduce])

  const inner = (
    <motion.div
      className="flex flex-col items-center px-6 py-10 text-center"
      initial={shouldReduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={shouldReduce ? { duration: 0 } : { duration: 0.5 }}
    >
      <span
        ref={ref}
        className="stat-num stats-number-lux section-title-lux luxury-color-text font-serif text-4xl font-semibold tracking-[-0.04em] text-stone-950 dark:text-stone-100 sm:text-5xl lg:text-6xl"
        data-tone="section"
        aria-label={`${prefix}${count}${suffix}`}
      >
        {(`${prefix}${count}${suffix}`).split('').map((char, i) => (
          <span className="luxury-letter" key={`stat-${i}`} aria-hidden="true">{char}</span>
        ))}
      </span>
      <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
        {label}
      </span>
      {onClick && (
        <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-700/60 dark:text-amber-500/60 opacity-0 group-hover:opacity-100 transition-opacity">
          смотреть →
        </span>
      )}
    </motion.div>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="stat-item stats-card group block w-full cursor-pointer transition-colors hover:bg-amber-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 dark:hover:bg-amber-900/10"
        title={`Перейти к списку: ${label}`}
      >
        {inner}
      </button>
    )
  }

  return inner
}

interface StatsBarProps {
  /** Total published articles */
  articleCount: number
  /** Chef-category count */
  authorCount: number
  /** Non-empty category count */
  categoryCount: number
  /** Scroll to the articles list */
  onGoToArticles?: () => void
}

export default function StatsBar({ articleCount, authorCount, categoryCount, onGoToArticles }: StatsBarProps) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const items = Array.from(document.querySelectorAll<HTMLElement>('#stats .stat-item'))
    const cleanups = items.map((item) => {
      const num = item.querySelector<HTMLElement>('.stat-num')
      if (!num) return () => undefined

      const onMove = (event: MouseEvent) => {
        const rect = item.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = event.clientX - cx
        const dy = event.clientY - cy
        const tx = Math.max(-9, Math.min(9, dx * 0.06))
        const ty = Math.max(-7, Math.min(7, dy * 0.05))
        const ry = Math.max(-4, Math.min(4, dx * 0.025))
        const rx = Math.max(-4, Math.min(4, -dy * 0.02))
        num.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.045)`
      }

      const onLeave = () => {
        num.style.transform = 'translate3d(0,0,0) rotateX(0deg) rotateY(0deg) scale(1)'
      }

      item.addEventListener('mousemove', onMove, { passive: true })
      item.addEventListener('mouseleave', onLeave)
      return () => {
        item.removeEventListener('mousemove', onMove)
        item.removeEventListener('mouseleave', onLeave)
      }
    })

    return () => cleanups.forEach(cleanup => cleanup())
  }, [])

  return (
    <section id="stats" className="border-y border-[var(--border-subtle)] bg-[var(--bg-deep)]">
      {/* Лишний подзаголовок "Сладкие цифры Франции" удалён по запросу клиента —
          в этом отделе оставляем только хлебную крошку "Архив · Статистика
          библиотеки". Сам термин "Сладкие цифры Франции" живёт в категории
          chiffres-gourmands (см. data/categories.ts → "Chiffres Gourmands"). */}
      <div className="mx-auto max-w-7xl px-4 pt-10 pb-6 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-800 dark:text-amber-400">
          Архив · Статистика библиотеки
        </p>
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px sm:grid-cols-4">
        <AnimatedCounter target={articleCount} label="материалов"     onClick={onGoToArticles} />
        <AnimatedCounter target={categoryCount} label="разделов"       onClick={onGoToArticles} />
        <AnimatedCounter target={authorCount}   label="шеф-кондитеров" onClick={onGoToArticles} />
        <AnimatedCounter target={100}           label="на русском" suffix="%" onClick={onGoToArticles} />
      </div>
    </section>
  )
}
