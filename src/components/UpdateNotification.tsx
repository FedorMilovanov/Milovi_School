/**
 * UpdateNotification — Уведомление об обновлении приложения.
 *
 * Использует нативный Service Worker API вместо vite-plugin-pwa.
 * Появляется снизу экрана когда браузер обнаруживает новый SW.
 * На мобильных поднят выше MobileBottomBar (~64px).
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
    // Safety fallback — cancelled immediately if controllerchange fires first.
    const fallbackTimer = window.setTimeout(reload, 3500)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.clearTimeout(fallbackTimer)
      reload()
    }, { once: true })
    worker.postMessage({ type: 'SKIP_WAITING' })
  }

  const handleDismiss = () => {
    setAnimateIn(false)
    window.setTimeout(() => setVisible(false), 350)
  }

  if (!visible) return null

  return (
    <>
      <style>{`
        .update-notification-root { bottom: 1.5rem; }
        @media (max-width: 1023px) { .update-notification-root { bottom: calc(5rem + env(safe-area-inset-bottom, 0px)); } }
      `}</style>
      <div className="update-notification-root" role="alert" aria-live="polite"
        style={{ position: 'fixed', left: '50%', transform: `translateX(-50%) translateY(${animateIn ? '0' : '120%'})`, transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)', zIndex: 9999, width: 'calc(100% - 2rem)', maxWidth: '480px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', borderRadius: '0.875rem', background: 'var(--bg-command, #18181b)', color: 'var(--text-primary, #fafafa)', boxShadow: '0 8px 32px rgba(0,0,0,0.22)', border: '1px solid rgba(217,164,85,0.15)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <div style={{ flexShrink: 0, width: '2rem', height: '2rem', borderRadius: '50%', background: 'rgba(217,164,85,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d9a455" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.3 }}>Доступна новая версия</p>
            <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', opacity: 0.65, lineHeight: 1.3 }}>Обновите страницу, чтобы увидеть изменения</p>
          </div>
          <button type="button" onClick={handleUpdate} disabled={isUpdating}
            style={{ flexShrink: 0, padding: '0.375rem 0.875rem', borderRadius: '0.25rem', background: isUpdating ? 'rgba(217,164,85,0.5)' : '#d9a455', color: '#11100e', fontSize: '0.8125rem', fontWeight: 700, border: 'none', cursor: isUpdating ? 'default' : 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-mono, JetBrains Mono, monospace)', transition: 'background 0.2s' }}
            onMouseEnter={e => { if (!isUpdating) e.currentTarget.style.background = '#f5efe5' }}
            onMouseLeave={e => { if (!isUpdating) e.currentTarget.style.background = '#d9a455' }}>
            {isUpdating ? 'Обновление…' : 'Обновить'}
          </button>
          <button type="button" onClick={handleDismiss} aria-label="Закрыть уведомление"
            style={{ flexShrink: 0, width: '1.75rem', height: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5, color: 'inherit' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
