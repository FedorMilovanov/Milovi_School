interface SkeletonProps {
  className?: string
}

export function SkeletonText({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ backgroundColor: 'var(--border-subtle)' }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="border-t pt-5" style={{ borderColor: 'var(--border-subtle)' }}>
      <div
        className="mb-5 h-48 md:h-60 w-full animate-pulse rounded"
        style={{ backgroundColor: 'var(--bg-deep)' }}
      />
      <SkeletonText className="h-5 w-3/4 mb-3" />
      <SkeletonText className="h-4 w-full mb-2" />
      <SkeletonText className="h-4 w-2/3" />
      <div
        className="mt-5 flex items-center justify-between border-t pt-3"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <SkeletonText className="h-3 w-20" />
        <SkeletonText className="h-3 w-16" />
      </div>
    </div>
  )
}

export function SkeletonArticleView() {
  return (
    <div className="max-w-3xl mx-auto w-full space-y-8 px-6 py-16">
      <SkeletonText className="h-12 w-3/4 mb-4" />
      <SkeletonText className="h-4 w-1/2 mb-8" />
      <div
        className="h-[400px] w-full rounded-xl animate-pulse"
        style={{ backgroundColor: 'var(--bg-deep)' }}
      />
      <SkeletonText className="h-4 w-full" />
      <SkeletonText className="h-4 w-5/6" />
      <SkeletonText className="h-4 w-full" />
      <SkeletonText className="h-4 w-4/5" />
      <SkeletonText className="h-4 w-full" />
      <SkeletonText className="h-4 w-2/3" />
    </div>
  )
}

/** Grid of skeleton cards for the archive/article list */
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
