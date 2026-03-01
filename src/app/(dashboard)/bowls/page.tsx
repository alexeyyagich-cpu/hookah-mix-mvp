'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useBowls } from '@/lib/hooks/useBowls'
import { BowlCard } from '@/components/dashboard/BowlCard'
import type { BowlType } from '@/types/database'
import { BOWL_PRESETS } from '@/data/bowls'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'
import { IconBowl, IconWarning } from '@/components/Icons'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PageBackground } from '@/components/ui/PageBackground'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const BOWL_BACKGROUNDS = [
  '/images/bowl-bg-1.jpg',
  '/images/bowl-bg-2.jpg',
  '/images/bowl-bg-3.jpg',
]

export default function BowlsPage() {
  const t = useTranslation('hookah')
  const tc = useTranslation('common')
  const {
    bowls,
    loading,
    error,
    addBowl,
    updateBowl,
    deleteBowl,
    setDefaultBowl,
    canAddMore,
  } = useBowls()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingBowl, setEditingBowl] = useState<BowlType | null>(null)
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Random background image selection
  const backgroundImage = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * BOWL_BACKGROUNDS.length)
    return BOWL_BACKGROUNDS[randomIndex]
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !capacity) return

    const parsed = parseFloat(capacity)
    if (isNaN(parsed) || parsed < 1 || parsed > 500) {
      setSubmitError(tc.errorSaving)
      return
    }

    setSaving(true)
    setSubmitError('')
    try {
      if (editingBowl) {
        await updateBowl(editingBowl.id, {
          name,
          capacity_grams: parsed,
        })
      } else {
        await addBowl({
          name,
          capacity_grams: parsed,
          is_default: bowls.length === 0,
        })
      }
      closeModal()
      toast.success(tc.saved)
    } catch {
      setSubmitError(tc.errorSaving)
    } finally {
      setSaving(false)
    }
  }

  const openModal = (bowl?: BowlType) => {
    setSubmitError('')
    if (bowl) {
      setEditingBowl(bowl)
      setName(bowl.name)
      setCapacity(bowl.capacity_grams.toString())
    } else {
      setEditingBowl(null)
      setName('')
      setCapacity('')
    }
    setModalOpen(true)
  }

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditingBowl(null)
    setName('')
    setCapacity('')
  }, [])

  useEffect(() => {
    if (!modalOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [modalOpen, closeModal])

  const [addingPreset, setAddingPreset] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(id)
  }

  const confirmDelete = async () => {
    try {
      if (confirmDeleteId) await deleteBowl(confirmDeleteId)
      setConfirmDeleteId(null)
      toast.success(tc.deleted)
    } catch {
      toast.error(tc.errorDeleting)
    }
  }

  return (
    <ErrorBoundary sectionName="Bowls">
    <div className="space-y-6 relative">
      <PageBackground image={backgroundImage} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.bowlsTitle}</h1>
          <p className="text-[var(--color-textMuted)]">
            {t.bowlsSubtitle}
          </p>
        </div>
        <button type="button"
          onClick={() => openModal()}
          className="btn btn-primary"
          disabled={!canAddMore}
        >
          + {t.addBowl}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-4 border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5">
          <div className="flex items-center gap-3">
            <IconWarning size={24} className="text-[var(--color-danger)] shrink-0" />
            <p className="text-[var(--color-danger)]">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="card p-12 text-center">
          <LoadingSpinner size="lg" className="mx-auto" />
          <p className="mt-4 text-[var(--color-textMuted)]">{tc.loading}</p>
        </div>
      ) : bowls.length === 0 ? (
        <EmptyState
          icon={<IconBowl size={32} />}
          title={t.noBowls}
          description={t.noBowlsDesc}
          action={{ label: `+ ${t.addBowl}`, onClick: () => openModal() }}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bowls.map((bowl) => (
            <BowlCard
              key={bowl.id}
              bowl={bowl}
              onEdit={openModal}
              onDelete={handleDelete}
              onSetDefault={setDefaultBowl}
            />
          ))}
        </div>
      )}

      {/* Preset Suggestions */}
      {bowls.length === 0 && (
        <div className="card p-6">
          <h3 className="text-base font-semibold mb-4">{t.bowlPresets}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {BOWL_PRESETS.slice(0, 8).map((preset) => (
              <button type="button"
                key={preset.name}
                onClick={async () => {
                  if (canAddMore && !addingPreset) {
                    setAddingPreset(preset.name)
                    try {
                      await addBowl({
                        name: preset.name,
                        capacity_grams: preset.capacity,
                        is_default: bowls.length === 0,
                      })
                    } finally {
                      setAddingPreset(null)
                    }
                  }
                }}
                disabled={!canAddMore || addingPreset === preset.name}
                className="p-4 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] hover:border-[var(--color-primary)] text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-medium">{preset.name}</div>
                <div className="text-sm text-[var(--color-textMuted)]">{preset.capacity}{tc.grams}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="bowl-modal-title" className="w-full max-w-md bg-[var(--color-bgCard)] rounded-2xl border border-[var(--color-border)]">
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
              <h2 id="bowl-modal-title" className="text-xl font-bold">
                {editingBowl ? t.editBowl : t.addBowl}
              </h2>
              <button type="button"
                onClick={closeModal}
                aria-label={tc.close}
                className="p-2 rounded-lg hover:bg-[var(--color-bgHover)] transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">{t.bowlName}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder={t.bowlNamePlaceholder}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">{t.bowlCapacity} ({tc.grams})</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="input"
                  placeholder="20"
                  min="5"
                  max="50"
                  step="1"
                  required
                />
              </div>

              {submitError && (
                <p className="text-sm text-[var(--color-danger)]">{submitError}</p>
              )}

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 btn btn-ghost"
                >
                  {tc.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!name || !capacity || saving}
                  className="flex-1 btn btn-primary disabled:opacity-50"
                >
                  {saving ? tc.saving : editingBowl ? tc.save : tc.add}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={!!confirmDeleteId}
        title={t.deleteBowlConfirm}
        message={tc.deleteWarning}
        confirmLabel={tc.delete}
        cancelLabel={tc.cancel}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
    </ErrorBoundary>
  )
}
