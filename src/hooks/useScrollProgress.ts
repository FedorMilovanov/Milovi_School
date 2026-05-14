import { useEffect, useState } from 'react'

/**
 * Single shared scroll listener that computes page scroll progress (0–100).
 * Used by both ScrollProgress bar and ScrollToTop button so the document
 * only registers ONE passive scroll handler instead of two doing identical math.
 */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const el = document.documentElement
      const total = el.scrollHeight - el.clientHeight
      setProgress(total > 0 ? Math.min(100, (el.scrollTop / total) * 100) : 0)
    }

    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  return progress
}
