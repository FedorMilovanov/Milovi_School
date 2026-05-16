import { safeGetItem, safeSetItem } from './storage'

const STREAK_KEY = 'reading-streak'
const LAST_READ_KEY = 'last-read-date'

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Пересчитывает серию чтения (стрик).
 * При markReadToday=true фиксирует сегодняшнее чтение.
 */
export function calculateReadingStreak(markReadToday = false): { streak: number; visible: boolean } {
  try {
    const today = formatLocalDate(new Date())
    const lastRead = safeGetItem(LAST_READ_KEY)
    let current = Number(safeGetItem(STREAK_KEY) ?? 0)
    if (!Number.isFinite(current)) current = 0

    if (lastRead === today) return { streak: current, visible: current >= 1 }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = formatLocalDate(yesterday)

    if (markReadToday) {
      current = lastRead === yesterdayStr ? current + 1 : 1
      safeSetItem(STREAK_KEY, String(current))
      safeSetItem(LAST_READ_KEY, today)
      return { streak: current, visible: true }
    }

    if (lastRead && lastRead !== yesterdayStr && lastRead !== today) {
      current = 0
      safeSetItem(STREAK_KEY, '0')
    }

    return { streak: current, visible: current >= 1 }
  } catch {
    return { streak: 0, visible: false }
  }
}
