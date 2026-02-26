'use client'

import { useRef, useEffect, useCallback } from 'react'

interface ScrollableTableProps {
  children: React.ReactNode
  className?: string
}

/**
 * Wrapper for tables with overflow-x-auto that shows a right-edge
 * fade indicator when content is horizontally scrollable.
 */
export function ScrollableTable({ children, className = '' }: ScrollableTableProps) {
  const ref = useRef<HTMLDivElement>(null)

  const updateScrollState = useCallback(() => {
    const el = ref.current
    if (!el) return
    const isScrollable = el.scrollWidth > el.clientWidth
    const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2
    el.classList.toggle('is-scrollable', isScrollable)
    el.classList.toggle('is-scrolled-end', isScrollable && isAtEnd)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    const ro = new ResizeObserver(updateScrollState)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      ro.disconnect()
    }
  }, [updateScrollState])

  return (
    <div ref={ref} className={`table-scroll-container ${className}`}>
      {children}
    </div>
  )
}
