import { useEffect, type RefObject } from 'react'

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
const activeModals: HTMLElement[] = []
const inertBranches = new Map<HTMLElement, { count: number; original: boolean }>()
let previousOverflow = ''
let previousPadding = ''

/** Shared focus/scroll lifecycle; Escape remains owned by each dialog's semantics. */
export function useModalFocus(ref: RefObject<HTMLElement>, open: boolean) {
  useEffect(() => {
    const dialog = ref.current
    if (!open || !dialog) return
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (activeModals.length === 0) {
      previousOverflow = document.body.style.overflow
      previousPadding = document.body.style.paddingRight
      const gap = window.innerWidth - document.documentElement.clientWidth
      if (gap > 0) document.body.style.paddingRight = `${gap}px`
      document.body.style.overflow = 'hidden'
    }
    activeModals.push(dialog)
    // Inert sibling branches, not ancestors: background controls must also be
    // unavailable to pointer and assistive-technology navigation, not just Tab.
    const background: HTMLElement[] = []
    let branch: HTMLElement = dialog
    while (branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling === branch || !(sibling instanceof HTMLElement) || ['SCRIPT', 'STYLE', 'LINK'].includes(sibling.tagName)) continue
        background.push(sibling)
        const entry = inertBranches.get(sibling) ?? { count: 0, original: sibling.inert }
        entry.count++
        inertBranches.set(sibling, entry)
        sibling.setAttribute('inert', '')
      }
      if (branch.parentElement === document.body) break
      branch = branch.parentElement
    }
    const isTop = () => activeModals[activeModals.length - 1] === dialog
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
      .filter(el => el.tabIndex >= 0 && el.getClientRects().length > 0 && window.getComputedStyle(el).visibility !== 'hidden' && !el.closest('[inert], [aria-hidden="true"]'))
    const focusFirst = () => (focusable()[0] ?? dialog).focus({ preventScroll: true })
    // The dialog is already committed. Deferring focus to another frame leaves
    // a visible dialog with keyboard events still targeting the background.
    focusFirst()
    const onFocus = (event: FocusEvent) => {
      if (isTop() && !dialog.contains(event.target as Node)) focusFirst()
    }
    const onTab = (event: KeyboardEvent) => {
      if (!isTop() || event.key !== 'Tab') return
      const items = focusable()
      const first = items[0] ?? dialog
      const last = items[items.length - 1] ?? dialog
      if (!dialog.contains(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      }
    }
    document.addEventListener('focusin', onFocus)
    document.addEventListener('keydown', onTab, true)
    return () => {
      document.removeEventListener('focusin', onFocus)
      document.removeEventListener('keydown', onTab, true)
      activeModals.splice(activeModals.indexOf(dialog), 1)
      for (const element of background) {
        const entry = inertBranches.get(element)!
        if (--entry.count === 0) {
          element.inert = entry.original
          inertBranches.delete(element)
        }
      }
      if (activeModals.length === 0) {
        document.body.style.overflow = previousOverflow
        document.body.style.paddingRight = previousPadding
      }
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [ref, open])
}
