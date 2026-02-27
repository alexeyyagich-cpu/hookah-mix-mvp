import { useEffect, type RefObject } from 'react'

export function useFocusTrap(ref: RefObject<HTMLElement | null>, isOpen: boolean, onEscape?: () => void) {
  useEffect(() => {
    if (!isOpen || !ref.current) return
    const el = ref.current
    const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

    // Small delay to let the DOM render
    const timer = setTimeout(() => {
      const focusable = el.querySelectorAll<HTMLElement>(focusableSelector)
      if (focusable.length > 0) focusable[0].focus()
    }, 50)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault()
        onEscape()
        return
      }
      if (e.key !== 'Tab') return
      const focusable = el.querySelectorAll<HTMLElement>(focusableSelector)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }

    el.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      el.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, ref, onEscape])
}
