/**
 * UpdateNotification — service-worker update banner.
 *
 * Styling is kept in Tailwind classes (no component-scoped media <style>) so
 * breakpoints stay aligned with MobileBottomBar / ToastContainer.
 */
import { useEffect, useRef, useState } from 'react'

export default function UpdateNotification() {
  const [visible, setVisible] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const waitingWorkerRef = useRef<ServiceWorker | null>(null)
  const refreshingRef = useRef(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const showUpdateBanner = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        waitingWorkerRef.current = registration.waiting
        setVisible(true)
        window.setTimeout(() => setAnimateIn(true), 50)
      }
    }

    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) return
      if (reg.waiting) showUpdateBanner(reg)
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner(reg)
          }
        })
      })
    })
  }, [])

  const handleUpdate = () => {
    const worker = waitingWorkerRef.current
    if (!worker || refreshingRef.current) return
    refreshingRef.current = true
    setIsUpdating(true)

    const reload = () => window.location.reload()
    const fallbackTimer = window.setTimeout(reload, 3500)
    const onControllerChange = () => {
      window.clearTimeout(fallbackTimer)
      reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange, { once: true })
    worker.postMessage({ type: 'SKIP_WAITING' })
    if (worker.state === 'activated') onControllerChange()
  }

  const handleDismiss = () => {
    setAnimateIn(false)
    window.setTimeout(() => setVisible(false), 350)
  }

  if (!visible) return null

  return (
    <div
      className={`fixed left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-[480px] -translate-x-1/2 transition-transform duration-300 ease-out bottom-6 max-lg:bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] ${animateIn ? 'translate-y-0' : 'translate-y-[120%]'}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-[0.875rem] border border-amber-400/15 bg-[var(--bg-command)] p-3.5 text-[var(--text-primary)] shadow-[0_8px_32px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-sm font-semibold leading-tight">Доступна новая версия</p>
          <p className="m-0 mt-0.5 text-xs leading-tight opacity-65">Обновите страницу, чтобы увидеть изменения</p>
        </div>
        <button
          type="button"
          onClick={handleUpdate}
          disabled={isUpdating}
          className="shrink-0 rounded bg-[#d9a455] px-3.5 py-1.5 font-mono text-[13px] font-bold uppercase tracking-[0.05em] text-[#11100e] transition hover:bg-[#f5efe5] disabled:cursor-default disabled:bg-amber-400/50"
        >
          {isUpdating ? 'Обновление…' : 'Обновить'}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Закрыть уведомление"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full opacity-50 transition hover:opacity-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}
