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
        className="font-serif text-4xl font-semibold tracking-[-0.04em] text-stone-950 dark:text-stone-100 sm:text-5xl lg:text-6xl"
      >
        {prefix}{count}{suffix}
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
        className="group block w-full transition-colors hover:bg-amber-50/40 dark:hover:bg-amber-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 cursor-pointer"
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
  return (
    <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-deep)]">
      <div className="mx-auto max-w-7xl px-4 pt-10 pb-6 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-800 dark:text-amber-400">
          Архив · Статистика библиотеки
        </p>
        <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.05em] text-stone-950 dark:text-stone-100 sm:text-4xl">
          Сладкие цифры Франции
        </h2>
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
