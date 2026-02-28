'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

interface SaveMixModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => Promise<void>
  defaultName?: string
}

export function SaveMixModal({ isOpen, onClose, onSave, defaultName = '' }: SaveMixModalProps) {
  const t = useTranslation('hookah')
  const [name, setName] = useState(defaultName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  useBodyScrollLock(isOpen)
  useFocusTrap(modalRef, isOpen, onClose)

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      setIsClosing(false)
      setName(defaultName)
      setError('')
    }
  }, [isOpen, defaultName])

  const handleClose = useCallback(() => {
    if (isClosing) return
    setIsClosing(true)
    setTimeout(() => {
      setVisible(false)
      setIsClosing(false)
      onClose()
    }, 200)
  }, [onClose, isClosing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError(t.mixSaveNameRequired)
      return
    }

    setSaving(true)
    setError('')

    try {
      await onSave(name.trim())
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.mixSaveError)
    }

    setSaving(false)
  }

  if (!visible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm ${isClosing ? 'animate-backdropFadeOut' : ''}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[70]">
        <div
          ref={modalRef}
          className={`rounded-2xl p-6 ${isClosing ? 'animate-fadeOutDown' : 'animate-fadeInUp'}`}
          style={{
            background: 'var(--color-bgCard)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              {t.mixSaveTitle}
            </h2>
            <button type="button"
              onClick={handleClose}
              aria-label={t.mixSaveClose}
              className="icon-btn icon-btn-sm icon-btn-ghost"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {t.mixSaveNameLabel}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.mixSaveNamePlaceholder}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl transition-colors"
                  style={{
                    background: 'var(--color-bgHover)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>

              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="p-3 rounded-lg text-sm"
                  style={{
                    background: 'color-mix(in srgb, var(--color-danger) 15%, transparent)',
                    color: 'var(--color-danger)',
                  }}
                >
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 rounded-xl font-medium transition-colors"
                  style={{
                    background: 'var(--color-bgHover)',
                    color: 'var(--color-text)',
                  }}
                >
                  {t.mixSaveCancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                  style={{
                    background: 'var(--color-primary)',
                    color: 'var(--color-bg)',
                  }}
                >
                  {saving ? t.mixSaving : t.mixSaveButton}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
