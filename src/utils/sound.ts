import { safeGetItem, safeSetItem } from './storage'

let audioCtx: AudioContext | null = null

export function isSoundEnabled() {
  if (typeof window === 'undefined') return false
  return safeGetItem('pref-sound-enabled') === 'true'
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  safeSetItem('pref-sound-enabled', String(enabled))
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) audioCtx = new AudioContextClass()
    } catch {
      return null
    }
  }
  return audioCtx
}

export function playTickSound(volume = 0.08) {
  if (!isSoundEnabled()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    // Если контекст приостановлен (фон, автополитика) — пробуем возобновить асинхронно.
    // Текущий звук пропускаем (нельзя планировать AudioNode на suspended ctx),
    // но следующий сработает нормально.
    if (ctx.state === 'suspended') {
      void ctx.resume()
      return
    }

    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1400, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.015)
    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.015)
    // Явно отключаем ноды после остановки, чтобы не накапливать
    // зомби-ссылки в аудиографе при долгих сессиях.
    osc.onended = () => { osc.disconnect(); gainNode.disconnect() }
  } catch {
    // Enhancement-only feedback.
  }
}

export function playSlideSound() {
  if (!isSoundEnabled()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    if (ctx.state === 'suspended') {
      void ctx.resume()
      return
    }

    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08)
    gainNode.gain.setValueAtTime(0.04, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.08)
    osc.onended = () => { osc.disconnect(); gainNode.disconnect() }
  } catch {
    // Enhancement-only feedback.
  }
}

if (typeof window !== 'undefined') {
  const unlock = () => {
    const ctx = getAudioContext()
    if (ctx && ctx.state === 'suspended') void ctx.resume()
    window.removeEventListener('click', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('click', unlock, { passive: true })
  window.addEventListener('keydown', unlock, { passive: true })
}