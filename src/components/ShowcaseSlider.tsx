import { useRef, useEffect, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from 'react'
import { motion } from 'framer-motion'
import { localImages } from '../assets/images'
import ImageWithFade from './ImageWithFade'

interface ShowcaseItem {
  title: string
  chef: string
  categoryId: string
  image: string
  desc: string
}

const items: ShowcaseItem[] = [
  { title: 'Ispahan',        chef: 'Pierre Hermé',   categoryId: 'pierre-herme',   image: localImages.macarons,  desc: 'Роза · Малина · Личи' },
  { title: 'Citron',         chef: 'Cédric Grolet',  categoryId: 'cedric-grolet',  image: localImages.fruits,    desc: 'Юдзу · Тонкая оболочка' },
  { title: 'Éclair Noisette',chef: 'Yann Couvreur',  categoryId: 'yann-couvreur',  image: localImages.pecan,     desc: 'Пралине · Сливки' },
  { title: 'Mogador',        chef: 'Pierre Hermé',   categoryId: 'pierre-herme',   image: localImages.mogador,   desc: 'Маракуйя · Шоколад' },
  { title: 'Tarte Chocolat', chef: 'Jacques Genin',  categoryId: 'jacques-genin',  image: localImages.chocolate, desc: 'Горький шоколад · Соль' },
]

interface ShowcaseSliderProps {
  onItemClick?: (categoryId: string) => void
}

const DRAG_THRESHOLD_PX = 6

export default function ShowcaseSlider({ onItemClick }: ShowcaseSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  /**
   * `moved` is set true whenever the pointer (mouse OR touch) drags farther
   * than DRAG_THRESHOLD_PX from its original press point. We use it from
   * the click-capture phase to suppress the synthetic click that follows
   * a drag, preventing accidental category navigation while swiping.
   */
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false })

  const stopDrag = () => {
    if (!drag.current.active) return
    drag.current.active = false
    drag.current.moved = false
    if (scrollRef.current) scrollRef.current.style.userSelect = ''
  }

  // FIX N-H-1: catch mouseup that happens outside the browser window
  useEffect(() => {
    window.addEventListener('mouseup', stopDrag)
    return () => window.removeEventListener('mouseup', stopDrag)
  }, [])

  // ── Mouse handlers ─────────────────────────────────────────────────────────
  const onMouseDown = (e: ReactMouseEvent) => {
    const el = scrollRef.current
    if (!el) return
    drag.current = { active: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft, moved: false }
    el.style.userSelect = 'none'
  }

  const onMouseMove = (e: ReactMouseEvent) => {
    if (!drag.current.active) return
    const el = scrollRef.current
    if (!el) return
    const x = e.pageX - el.offsetLeft
    const delta = x - drag.current.startX
    if (Math.abs(delta) > DRAG_THRESHOLD_PX) drag.current.moved = true
    el.scrollLeft = drag.current.scrollLeft - delta
  }

  // ── Touch handlers ─────────────────────────────────────────────────────────
  // Mirror the mouse logic so swipes on mobile suppress the click event the
  // same way a mouse drag does. The browser still drives the actual scrolling
  // natively via overflow + touch-pan-x, so we only need to record whether
  // the finger moved, not move the scroll position ourselves.
  const onTouchStart = (e: ReactTouchEvent) => {
    if (e.touches.length !== 1) return
    drag.current = {
      active: true,
      startX: e.touches[0].clientX,
      scrollLeft: scrollRef.current?.scrollLeft ?? 0,
      moved: false,
    }
  }

  const onTouchMove = (e: ReactTouchEvent) => {
    if (!drag.current.active || e.touches.length !== 1) return
    const delta = e.touches[0].clientX - drag.current.startX
    if (Math.abs(delta) > DRAG_THRESHOLD_PX) drag.current.moved = true
  }

  // Suppress click on cards when drag moved (prevents accidental navigation)
  const onClickCapture = (e: ReactMouseEvent) => {
    if (drag.current.moved) { e.stopPropagation(); e.preventDefault(); drag.current.moved = false }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-800 dark:text-amber-200">Знаковые творения</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.05em] text-stone-950 dark:text-stone-100 sm:text-4xl">
          Иконы современной pâtisserie
        </h2>
      </div>

      {/* Drag-scroll region: native overflow remains keyboard-scrollable when focused via browser chrome; mouse/touch handlers only enhance pointer UX. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex touch-pan-x select-none gap-6 overflow-x-auto overscroll-x-contain pb-4 cursor-grab active:cursor-grabbing"
        role="region"
        aria-label="Горизонтальная галерея знаковых десертов"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={stopDrag}
        onTouchCancel={stopDrag}
        onClickCapture={onClickCapture}
      >
        {items.map((item, index) => (
          <motion.button
            key={item.title}
            type="button"
            aria-label={`Показать материалы: ${item.chef} — ${item.title}`}
            onClick={() => onItemClick?.(item.categoryId)}
            className={`w-72 shrink-0 border border-[var(--border-subtle)] bg-[var(--bg-main)] p-4 text-left transition-colors hover:border-stone-400 dark:hover:border-stone-600 ${onItemClick ? 'cursor-pointer' : ''}`}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <ImageWithFade src={item.image} alt={item.title} className="h-48 w-full" />
            <div className="mt-4 space-y-1">
              <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
                <span>{item.chef}</span>
              </div>
              <h4 className="font-serif text-xl font-semibold text-stone-950 dark:text-stone-100">{item.title}</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400">{item.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  )
}
