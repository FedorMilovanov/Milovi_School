import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface ImageWithFadeProps {
  src: string
  alt: string
  className?: string
  lazy?: boolean
}

export default function ImageWithFade({ src, alt, className = '', lazy = true }: ImageWithFadeProps) {
  const [isIntersected, setIsIntersected] = useState(!lazy)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
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

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-stone-100 dark:bg-stone-900 ${className}`}>
      {/* Premium Shimmer Skeleton - remains visible until fully loaded */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 dark:from-stone-800 dark:via-stone-700 dark:to-stone-800 animate-pulse z-10" />
      )}

      {isIntersected && !error && (
        <motion.img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          initial={shouldReduce ? false : { opacity: 0, scale: 1.02 }}
          animate={loaded ? { opacity: 1, scale: 1 } : (shouldReduce ? { opacity: 1 } : { opacity: 0 })}
          transition={shouldReduce ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}

      {/* Fallback on network or asset load error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-200 dark:bg-stone-800 text-stone-400">
          <svg className="h-6 w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
      )}
    </div>
  )
}
