import { safeGetItem, safeSetItem } from './storage'

export function isHapticEnabled() {
  if (typeof window === 'undefined') return false
  return safeGetItem('pref-haptic-enabled') !== 'false'
}

export function setHapticEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  safeSetItem('pref-haptic-enabled', String(enabled))
}

export function vibrate(pattern: number | number[] = 10) {
  if (!isHapticEnabled()) return
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // Enhancement-only feedback.
    }
  }
}

export function vibrateSuccess() {
  vibrate([10, 40, 10])
}

export function vibrateLight() {
  vibrate(5)
}