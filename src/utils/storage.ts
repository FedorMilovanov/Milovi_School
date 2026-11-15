export function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    // Storage can be unavailable in private browsing or locked-down webviews.
    return false
  }
}

export function safeRemoveItem(key: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Storage can be unavailable in private browsing or locked-down webviews.
  }
}