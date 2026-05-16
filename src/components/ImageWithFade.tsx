import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface ImageWithFadeProps {
  src: string
  alt: string
  className?: string
  lazy?: boolean
  fallback?: string
  fetchPriority?: 'high' | 'low' | 'auto'
}

const DEFAULT_FALLBACK = '/images/placeholder.svg'

export default function ImageWithFade({ src, alt, className = '', lazy = true, fallback = DEFAULT_FALLBACK, fetchPriority = 'auto' }: ImageWithFadeProps) {
  const [isIntersected, setIsIntersected] = useState(!lazy)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [usingFallback, setUsingFallback] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldReduce = useReducedMotion()

  useEffect(() => {
    if (!lazy || !containerRef.current) return

    const el = containerRef.current

    // Mobile fix: IntersectionObserver callbacks are async and can miss elements
    // already in the viewport at mount time. Check synchronously first.
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight + 400) {
      setIsIntersected(true)
      return
    }

    // Safety net: force-load after 3 s in case the observer never fires
    // (e.g. hidden overflow parent, zero-height container on first paint).
    const timer = window.setTimeout(() => {
      setIsIntersected(true)
    }, 3000)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersected(true)
          window.clearTimeout(timer)
          observer.disconnect()
        }
      },
      { rootMargin: '400px' },
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
    }
  }, [lazy])

  useEffect(() => {
    setLoaded(false)
    setError(false)
    setUsingFallback(false)
  }, [src])

  const handleError = () => {
    if (!usingFallback && fallback) {
      setUsingFallback(true)
      setLoaded(false)
      return
    }
    setError(true)
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-stone-100 dark:bg-[#0a0a0a] ${className}`}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 dark:from-[#0f0f0f] dark:via-[#1a1a1a] dark:to-[#0f0f0f] animate-pulse z-10" />
      )}

      {isIntersected && !error && (
        <motion.img
          src={usingFallback ? fallback : src}
          alt={alt}
          className="h-full w-full object-cover"
          style={{ willChange: loaded ? 'auto' : 'opacity, filter' }}
          initial={shouldReduce ? false : { opacity: 0, filter: 'blur(8px)' }}
          animate={loaded
            ? { opacity: 1, filter: 'blur(0px)' }
            : (shouldReduce ? { opacity: 1 } : { opacity: 0, filter: 'blur(8px)' })}
          transition={shouldReduce ? { duration: 0 } : { duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          fetchPriority={fetchPriority !== 'auto' ? fetchPriority : undefined}
        />
      )}

      {error && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{
            background: 'linear-gradient(135deg, #111 0%, #000 100%)',
          }}
          role="img"
          aria-label={alt}
        >
          <img
            src="/images/logo.png"
            alt="Patisserie Russe"
            style={{
              width: 56, height: 56, objectFit: 'contain', borderRadius: 4,
              border: '1px solid rgba(212, 175, 55, 0.3)',
            }}
          />
        </div>
      )}
    </div>
  )
}
