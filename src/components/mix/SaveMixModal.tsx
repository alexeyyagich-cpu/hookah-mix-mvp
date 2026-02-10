'use client'

import { useState, useEffect } from 'react'

interface SaveMixModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => Promise<void>
  defaultName?: string
}

export function SaveMixModal({ isOpen, onClose, onSave, defaultName = '' }: SaveMixModalProps) {
  const [name, setName] = useState(defaultName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(defaultName)
      setError('')
    }
  }, [isOpen, defaultName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Введите название микса')
      return
    }

    setSaving(true)
    setError('')

    try {
      await onSave(name.trim())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    }

    setSaving(false)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[70]">
        <div
          className="rounded-2xl p-6 animate-fadeInUp"
          style={{
            background: 'var(--color-bgCard)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Сохранить микс
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--color-bgHover)] transition-colors"
              style={{ color: 'var(--color-textMuted)' }}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  Название микса
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Летний вечер"
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
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl font-medium transition-colors"
                  style={{
                    background: 'var(--color-bgHover)',
                    color: 'var(--color-text)',
                  }}
                >
                  Отмена
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
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
