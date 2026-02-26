'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

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
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)
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

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      setVisible(false)
      setIsClosing(false)
      onCancel()
    }, 200)
  }, [onCancel])

  useEffect(() => {
    if (!visible) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [visible, handleClose])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${isClosing ? 'animate-backdropFadeOut' : 'animate-fadeInUp'}`}
        role="button"
        tabIndex={-1}
        aria-label="Close"
        onClick={handleClose}
        onKeyDown={(e) => e.key === 'Escape' && handleClose()}
      />
      <div role="alertdialog" aria-labelledby="confirm-title" aria-describedby="confirm-message" className={`relative w-full max-w-sm rounded-2xl bg-[var(--color-bgCard)] border border-[var(--color-border)] shadow-xl p-6 ${
        isClosing ? 'animate-fadeOutDown' : 'animate-scaleIn'
      }`}>
        <h3 id="confirm-title" className="text-lg font-bold mb-2">{title}</h3>
        <p id="confirm-message" className="text-sm text-[var(--color-textMuted)] mb-5">{message}</p>
        <div className="flex gap-3">
          <button type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-bgHover)] hover:opacity-80 transition-opacity"
          >
            {cancelLabel}
          </button>
          <button type="button"
            ref={confirmRef}
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80 ${
              danger
                ? 'bg-[var(--color-danger)] text-white'
                : 'bg-[var(--color-primary)] text-[var(--color-bg)]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
