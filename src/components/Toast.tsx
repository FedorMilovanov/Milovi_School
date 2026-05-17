import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type ToastType = 'save' | 'copy' | 'share' | 'info'

interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

// Global toast emitter — работает без контекста React
type Listener = (msg: ToastMessage) => void
const listeners = new Set<Listener>()

function createToastId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function showToast(type: ToastType, message: string) {
  const msg: ToastMessage = { id: createToastId(), type, message }
  listeners.forEach((fn) => fn(msg))
}

function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'save') {
    return (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    )
  }
  if (type === 'copy' || type === 'share') {
    return (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  // info
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
    </svg>
  )
}

export default function ToastContainer({ className }: { className?: string }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const timeoutsRef = useRef<number[]>([])

  useEffect(() => {
    const listener: Listener = (msg) => {
      setToasts((prev) => [...prev.slice(-3), msg])
      const id = window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id))
        timeoutsRef.current = timeoutsRef.current.filter((x) => x !== id)
      }, 2800)
      timeoutsRef.current.push(id)
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
      timeoutsRef.current.forEach((id) => window.clearTimeout(id))
      timeoutsRef.current = []
    }
  }, [])

  return (
    <div className={`fixed left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse gap-2 pointer-events-none ${className || "max-lg:bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6"}`}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2.5 px-4 py-3 border shadow-2xl pointer-events-auto whitespace-nowrap"
            style={{
              backgroundColor: 'var(--bg-command)',
              borderColor: 'var(--text-accent)',
              color: 'var(--text-primary)',
            }}
          >
            <span style={{ color: 'var(--text-accent)' }}>
              <ToastIcon type={toast.type} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
