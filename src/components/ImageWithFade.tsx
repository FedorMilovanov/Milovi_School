import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface ImageWithFadeProps {
  src: string
  alt: string
  className?: string
  lazy?: boolean
  /** Optional local fallback image (URL). Defaults to brand SVG placeholder. */
  fallback?: string
}

const DEFAULT_FALLBACK = '/images/placeholder.svg'

export default function ImageWithFade({ src, alt, className = '', lazy = true, fallback = DEFAULT_FALLBACK }: ImageWithFadeProps) {
  const [isIntersected, setIsIntersected] = useState(!lazy)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [usingFallback, setUsingFallback] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldReduce = useReducedMotion()

  useEffect(() => {
    if (!lazy || !containerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersected(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [lazy])

  // Reset on src change
  useEffect(() => {
    setLoaded(false)
    setError(false)
    setUsingFallback(false)
  }, [src])

  const handleError = () => {
    if (!usingFallback && fallback) {
      // Try local fallback first — graceful degradation, still pretty
      setUsingFallback(true)
      setLoaded(false)
      return
    }
    setError(true)
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-stone-100 dark:bg-stone-900 ${className}`}>
      {/* Premium Shimmer Skeleton — visible until fully loaded */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 dark:from-stone-800 dark:via-stone-700 dark:to-stone-800 animate-pulse z-10" />
      )}

      {isIntersected && !error && (
        <motion.img
          src={usingFallback ? fallback : src}
          alt={alt}
          className="h-full w-full object-cover"
          initial={shouldReduce ? false : { opacity: 0, scale: 1.02 }}
          animate={loaded ? { opacity: 1, scale: 1 } : (shouldReduce ? { opacity: 1 } : { opacity: 0 })}
          transition={shouldReduce ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
        />
      )}

      {/* Final brand fallback — shown if even the local SVG fails (extremely rare) */}
      {error && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{
            background:
              'linear-gradient(135deg, #1c1917 0%, #100c0a 60%, #050403 100%)',
          }}
          role="img"
          aria-label={alt}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 56,
              height: 56,
              border: '1px solid #D4A96A',
              borderRadius: 0,
              fontFamily: 'Georgia, serif',
              fontWeight: 700,
              fontSize: 22,
              color: '#D4A96A',
              letterSpacing: '-0.04em',
            }}
          >
            PR
          </div>
          <span
            className="mt-3 font-mono"
            style={{ fontSize: 9, letterSpacing: '0.32em', color: '#D4A96A', opacity: 0.75 }}
          >
            PATISSERIE • RUSSE
          </span>
        </div>
      )}
    </div>
  )
}
