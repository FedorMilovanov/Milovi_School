import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { libraryMeta } from '../data/library'
import { categories } from '../data/categories'

interface AnimatedCounterProps {
  target: number
  suffix?: string
  prefix?: string
  label: string
}

function AnimatedCounter({ target, suffix = '', prefix = '', label }: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
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
  }, [target])

  return (
    <motion.div
      className="flex flex-col items-center px-6 py-10 text-center"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <span ref={ref} className="font-serif text-4xl font-semibold tracking-[-0.04em] text-stone-950 dark:text-stone-100 sm:text-5xl lg:text-6xl">
        {prefix}{count}{suffix}
      </span>
      <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 dark:text-stone-400">
        {label}
      </span>
    </motion.div>
  )
}

const articleCount = libraryMeta.length
const categoryCount = categories.length
// Count unique authors
const authorCount = new Set(libraryMeta.map(a => a.author).filter(Boolean)).size

export default function StatsBar() {
  return (
    <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-deep)]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px sm:grid-cols-4">
        <AnimatedCounter target={articleCount} label="материалов" />
        <AnimatedCounter target={categoryCount} label="разделов" />
        <AnimatedCounter target={authorCount > 0 ? authorCount : 12} label="шеф-кондитеров" />
        <AnimatedCounter target={100} label="на русском" suffix="%" />
      </div>
    </section>
  )
}
