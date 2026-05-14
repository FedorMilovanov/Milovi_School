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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersected(true)
          observer.disconnect()
        }
      },
      { rootMargin: '400px' } // Pre-load slightly earlier (SEO May 2026 performance optimization)
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
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
          title={alt}
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
          fetchPriority={fetchPriority}
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
          <div
            className="flex items-center justify-center"
            style={{
              width: 56, height: 56, border: '1px solid #d4af37', borderRadius: 4,
              fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 22, color: '#d4af37',
            }}
          >
            PR
          </div>
        </div>
      )}
    </div>
  )
}
