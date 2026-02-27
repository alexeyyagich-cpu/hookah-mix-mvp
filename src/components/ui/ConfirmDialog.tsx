'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const tc = useTranslation('common')
  const resolvedConfirmLabel = confirmLabel ?? tc.confirm
  const resolvedCancelLabel = cancelLabel ?? tc.cancel
  const confirmRef = useRef<HTMLButtonElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [visible, setVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setVisible(true)
      setIsClosing(false)
    }
  }, [open])

  useEffect(() => {
    if (visible && !isClosing) confirmRef.current?.focus()
  }, [visible, isClosing])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(closeTimerRef.current)
  }, [])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    closeTimerRef.current = setTimeout(() => {
      setVisible(false)
      setIsClosing(false)
      onCancel()
    }, 200)
  }, [onCancel])

  useEffect(() => {
    if (!visible) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [visible, handleClose])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${isClosing ? 'animate-backdropFadeOut' : 'animate-fadeInUp'}`}
        aria-hidden="true"
        onClick={handleClose}
      />
      <div role="alertdialog" aria-labelledby="confirm-title" aria-describedby="confirm-message" className={`relative w-full max-w-sm rounded-2xl bg-[var(--color-bgCard)] border border-[var(--color-border)] shadow-xl p-6 ${
        isClosing ? 'animate-fadeOutDown' : 'animate-scaleIn'
      }`}>
        <h3 id="confirm-title" className="text-lg font-bold mb-2">{title}</h3>
        <p id="confirm-message" className="text-sm text-[var(--color-textMuted)] mb-5">{message}</p>
        <div className="flex gap-3">
          <button type="button"
            onClick={handleClose}
            data-testid="confirm-dialog-cancel"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-bgHover)] hover:opacity-80 transition-opacity"
          >
            {resolvedCancelLabel}
          </button>
          <button type="button"
            ref={confirmRef}
            data-testid="confirm-dialog-confirm"
            disabled={isClosing}
            onClick={() => { if (!isClosing) onConfirm() }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50 disabled:pointer-events-none ${
              danger
                ? 'bg-[var(--color-danger)] text-white'
                : 'bg-[var(--color-primary)] text-[var(--color-bg)]'
            }`}
          >
            {resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
