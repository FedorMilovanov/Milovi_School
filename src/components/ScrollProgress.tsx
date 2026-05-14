import { useScrollProgress } from '../hooks/useScrollProgress'

export default function ScrollProgress() {
  const progress = useScrollProgress()
  // BUG FIX: don't render at 0 — invisible but wastes a paint
  if (progress <= 0) return null
  return <div className="scroll-progress" style={{ width: `${progress}%` }} />
}
