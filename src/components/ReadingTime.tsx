interface ReadingTimeProps {
  minutes: number
  className?: string
}

export default function ReadingTime({ minutes, className }: ReadingTimeProps) {
  const format = (m: number) => {
    if (m < 10) return `${m} мин`
    if (m < 60) return `${m} мин`
    const h = Math.floor(m / 60)
    const rem = m % 60
    return rem > 0 ? `${h} ч ${rem} мин` : `${h} ч`
  }

  return (
    <span className={`inline-flex items-center gap-1.5 align-middle font-mono text-[10px] uppercase tracking-[0.22em] ${className}`}>
      <svg className="h-3.5 w-3.5 text-stone-400 dark:text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {format(minutes)}
    </span>
  )
}
